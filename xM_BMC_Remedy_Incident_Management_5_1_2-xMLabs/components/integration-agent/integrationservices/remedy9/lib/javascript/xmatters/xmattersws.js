importPackage(java.util);
importPackage(java.io);
importClass(Packages.com.alarmpoint.integrationagent.config.IAConfigImpl);
importClass(Packages.com.alarmpoint.integrationagent.config.xml.IAConfigFileImpl);
importClass(Packages.com.alarmpoint.integrationagent.security.EncryptionUtils);
importClass(Packages.com.alarmpoint.integrationagent.util.EventDeduplicator);

/******************************************************************************/
/*        Start of xMatters Webservices Base Class Object Definition          */
/******************************************************************************/
var failedList = new ArrayList();
var successList = new ArrayList();
var warningList = new ArrayList();
var reprocessedList = new ArrayList();

var xmns = new Namespace("http://www.alarmpoint.com/webservices/schema");

var iaConfig = null;
var configFile = null;
var iaConfigFile = null;

var xMattersWS = WSUtil.extend({

  LOG_SOURCE: "xmattersws.js: ",

  XMATTERS_WSDL_DEFN: "integrationservices/remedy9/lib/resources/soap/xmatters/v4.1/AlarmPoint-soapui-project.xml",
  XM_SOAP_VERSION: "1_1",
  SERVICE_DENIED: "SERVICE_DENIED",
  SUPERVISOR_INVALID: "SUPERVISOR_INVALID",
  UNKNOWN_SUPERVISOR: "UNKNOWN_SUPERVISOR",
  UNKNOWN_INCIDENT: "UNKNOWN_INCIDENT",

  IA_CONFIG_FILE_PATH: "conf/IAConfig.xml",
  
  TOKEN_NAME: "apiaResult",
  TOKEN_NAME_EXCEPTION: "apiaResultException",
  
  DEFAULT_TEAM_NAME: "Default Team",
  DEFAULT_COVERAGE_NAME: "Default Coverage",
  
  /**
   * If true, will automatically use the proxy configuration (if any) defined in the IAConfig.xml.
   * Requires an Integration Agent version that supports proxy configuration through IAConfig.xml.
   */
  AUTOCONFIGURE_PROXY: false,
  

  /**
   * Constructor
   */
  init: function()
  {
    this._super(); 

    if( iaConfig == null )
    {
      configFile = new File(this.IA_CONFIG_FILE_PATH);
      iaConfigFile = new IAConfigFileImpl(new FileReader(configFile));
      iaConfig = new IAConfigImpl(iaConfigFile, configFile.getParentFile(), configFile.toURI());
    }
    
    this.wsUser = iaConfigFile.getWSUser();
    this.wsPassword = iaConfig.getWsAuth().getPassword();
    this.wsCompany = iaConfigFile.getWSCompany();
    this.endPoint = iaConfigFile.getPrimaryServerUrls().next();

    if (this.AUTOCONFIGURE_PROXY && iaConfig.getProxyConfig().isProxyEnabled()) {
        var proxyConfig = iaConfig.getProxyConfig();
        this.initProxy(proxyConfig.getHost(), proxyConfig.getPort(), proxyConfig.getUsername(),
                proxyConfig.getPassword(), proxyConfig.getNtlmDomain());
    }
  },
  
  /**
   * Sends the request to the SOAP endpoint and returns the response
   * @param url EndPoint for the webservice request
   * @param msg SOAPMessage instance containing the SOAPEnvelope to post
   * @param objectType the type of object being synchronized (User, Coverage, Device, Group, Team)
   * @param objectName the name of the object being synchronized
   * @return SOAP Response Body
   */
  syncSendReceive: function(url, msg, objectType, objectName)   
  {
    var response = this.sendReceive(url, msg);

    default xml namespace = xmns;
    var status = response..status;
    
    if (!"OK".equalsIgnoreCase(status))
    {
      if (this.SERVICE_DENIED.equalsIgnoreCase(status))
      {
        // Likely to have a misconfigured user, so log this at error level (APO-6415)
        this.log.error("xMattersWS.syncSendReceive - Response Status: " + status
          + ". The webservice user does not have the correct permissions in xMatters. Please update the configuration.");
      }
      else
      {
        this.log.debug("\txMattersWS.syncSendReceive - Response Status: " + status);
      }

      var object = "user".equalsIgnoreCase(objectType) ? new User() : new Group();
      if (this.SUPERVISOR_INVALID.equalsIgnoreCase(status) || this.UNKNOWN_SUPERVISOR.equalsIgnoreCase(status))
      {
        var msg = objectType + ": " + objectName + " " + this.SUPERVISOR_INVALID + ". Setting supervisors to: " + object.supervisors;
        if (warningList.contains(msg))
        {
          warningList.remove(msg);
          failedList.add(objectType + ": " + objectName + " failed to synchronize: " + status);
        }
        else
        {
          reprocessedList.add(objectType + ": " + objectName);
          warningList.add(msg);
        }
      }
      else
      {
        failedList.add(objectType + ": " + objectName + " failed to synchronize: " + status);
      }
    }
    else
    {
      if (!reprocessedList.contains(objectType + ": " + objectName))
      {
        successList.add(objectType + ": " + objectName + " synchronized: " + status);
      }
    }
    return response;
  },
  
  /**
   * Query xMatters for the incident
   * @param incidentId id of the incident to retrieve
   * @return true if the incident exists, false otherwise
   */
  queryIncident: function(incidentId)
  {
    var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "QueryIncident", "QueryIncident", this.XM_SOAP_VERSION);

    // Set the parameter values
    msg.setParameter("user", this.wsUser);
    msg.setParameter("password", this.wsPassword);
    msg.setParameter("company", this.wsCompany);
    msg.setParameter("incidentIdentifier", incidentId);
  
    // Post the message to the SOAP endpoint
    var response = this.sendReceive(this.endPoint, msg);

    var status = response.xmns::QueryIncidentResponse.child(QName(xmns, "return")).xmns::status;
    
    if (this.SERVICE_DENIED.equalsIgnoreCase(status))
    {
      // Likely to have a misconfigured user, so log this at error level (APO-6415)
      this.log.error("xMattersWS.queryIncident - Response Status: " + status
        + ". The webservice user does not have the QueryIncident permission in xMatters. Please update the configuration.");
    }
    else
    {
      this.log.debug("\txMattersWS.queryIncident - Response Status: " + status);
    }

    var exists = !this.UNKNOWN_INCIDENT.equalsIgnoreCase(status) && !this.SERVICE_DENIED.equalsIgnoreCase(status);

    return exists;
  },

  /**
   * Send a DEL APXML message if an Event with the given Incident ID exists in xMatters
   * @param incidentId id of the incident/event that will be terminated
   * @param apiaProcessGroup of the incident being added
   */
  sendDelAPXML: function(incidentId, apiaProcessGroup, apiaPriority)
  {
    var apxml = ServiceAPI.createAPXML();
    apxml.setMethod("DEL");
    apxml.setSubclass("action");
	if (apiaProcessGroup != null && apiaProcessGroup != "") {
      apxml.setToken(APXMLMessage.APIA_PROCESS_GROUP, apiaProcessGroup);
	} else {
	  apxml.setToken(APXMLMessage.APIA_PROCESS_GROUP, incidentId);
	}
    apxml.setToken("incident_id", incidentId);
    apxml.setToken("company_name", this.wsCompany);
	apxml.setToken(APXMLMessage.APIA_PRIORITY, apiaPriority);

    log.debug("\txMattersWS.sendDelAPXML - Built DEL apxml: " + apxml);
    
    try
    {
      ServiceAPI.sendAPXML(apxml);
    }
    catch (e)
    {
      log.error("xMattersWS.sendDelAPXML - Caught exception sending del to xMatters for Incident ID: " + incidentId);
      throw e;
    }
    
    log.debug("\txMattersWS.sendDelAPXML - DEL apxml sent to xMatters");
  },
           
  /**
   * Submits the APXML to xMatters for processing
   * @param apxml APXML to submit
   */
  submitAPXML: function(apxml, delExistingEvents)  
  {
    // Invoke event de-duplication for any other event 
    // if we haven't got more than 1 event in the programmed timeout 
    var wasSubmitted = true;
    var recentlyReceived = EventDeduplicator.getInstance().recentOccurrenceCount(apxml, DEDUPLICATOR_FILTER); 
    if (recentlyReceived <= 1) 
    {
	  // set the apia_process_group so the DEL and ADD are processed in the correct order
	  var apiaProcessGroup = apxml.getValue(APXMLMessage.APIA_PROCESS_GROUP);
	  if ( apiaProcessGroup == null || apiaProcessGroup == "") {
		apiaProcessGroup = apxml.getValue("incident_id");
		apxml.setToken(APXMLMessage.APIA_PROCESS_GROUP, apxml.getValue("incident_id"));	 
	  }	   

	  // apia_priority also needs to match in the add and the del
	  var apiaPriority = apxml.getValue(APXMLMessage.APIA_PRIORITY);
	  if ( apiaPriority == null || apiaPriority == "") {
		apiaPriority = "normal";
		apxml.setToken(APXMLMessage.APIA_PRIORITY, apiaPriority);
	  }

      if (delExistingEvents)
      {
        this.sendDelAPXML(apxml.getValue("incident_id"), apiaProcessGroup, apiaPriority);
      }

      // set the apia_process_group to the incident_id, this is also done for the DEL so that the order is kept
	  apxml.setToken(APXMLMessage.APIA_PROCESS_GROUP, apiaProcessGroup);
      ServiceAPI.sendAPXML(apxml);
      log.debug("xMattersWS.submitAPXML - Finished sending apxml to xMatters");
    } 
    else 
    { 
      log.warn("***Deduplicator Suppressed Notification ***: An event with tokens " + this.convertTokensToString(apxml) + " has been injected into the " + 
               apxml.getValue("agent_client_id") + " event domain " + recentlyReceived + " times within the configured suppression period.  It has been suppressed." ); 
      wasSubmitted = false;
    }
    return wasSubmitted;
  },  
  
  /**
   * Adds event tokens to the APXML instance from the given javascript object
   * @param apxml APXML to update
   * @param object instance of the object to parse
   * @return APXML populated with the object values
   */
  addEventTokensFromObject: function(apxml, obj)
  {
    for (var attribute in obj) {
      if(typeof obj[attribute] == "string") { 
        apxml.setToken(attribute, obj[attribute]);
      }  
    }
    return apxml;
  },
  

  /**
   * Initializes the response to be returned to the device
   * @param apxml APXML containing the request information
   * @return initialized instance of the response APXML
   */
  initializeResponse: function(apxml)
  {
    var response = ServiceAPI.createAPXML();
    response.setMethod(APXMLMessage.RESPONSE_METHOD);
    response.setSubclass(APXMLMessage.RESPONSE_SUBCLASS);
    
    if (apxml.hasToken(APXMLMessage.REQUEST_ID))
    {
      response.setToken(APXMLMessage.REQUEST_ID, apxml.getValue(APXMLMessage.REQUEST_ID), APXMLToken.Type.STRING);
    }
    response.setToken(APXMLMessage.DESTINATION, apxml.getValue(APXMLMessage.ORIGINATOR), APXMLToken.Type.STRING);
    if (apxml.hasToken(APXMLMessage.APIA_PRIORITY)) 
    {
      response.setToken(APXMLMessage.APIA_PRIORITY, apxml.getValue(APXMLMessage.APIA_PRIORITY));
    }
    else
    {
      response.setToken(APXMLMessage.APIA_PRIORITY, APXMLMessage.APIA_PRIORITY_HIGH);
    }
    return response;
  },
  
  /** 
   * Convert all tokens for this message into a parenthesis-grouped set of name-value-pairs. 
   * @param apxml tokens to be converted into a string
   * @return string representation of input tokens 
   */ 
  convertTokensToString: function(apxml) 
  { 
    var string = ""; 
    var tokenIterator = apxml.getTokens(); 
    while (tokenIterator.hasNext()) 
    { 
        var token = tokenIterator.next();
        string += "(" + token.getKey() + ", " + token.getValue() + ")";
    } 
    return string; 
  },

  /**
   * Decrypts the password stored in an integrationg agent password file.  eg .wspasswd or *.pwd
   * @param passwordFile file/path of the file containing the encrypted password
   * @return decrypted password or an empty string if the password cannot be decrypted
   */
  getPassword: function(passwordFile)
  {
    try
    {
    	var encryptionUtils = new EncryptionUtils();
    	var file = new File(passwordFile);
    	return encryptionUtils.decrypt(file);
    }
    catch (e)
    {
    	return "";
    }
  }
  
});
