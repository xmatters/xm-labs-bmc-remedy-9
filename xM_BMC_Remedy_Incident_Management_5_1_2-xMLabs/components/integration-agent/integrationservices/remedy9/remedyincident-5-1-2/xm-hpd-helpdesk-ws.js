/******************************************************************************/
/*                Start of Remedy XM_HPD_HelpDesk WS Definition               */
/******************************************************************************/
var XMHPDHelpDeskWS = BaseClass.extend({

  LOG_SOURCE: "xm-hpd-helpdesk-ws.js: ",
  XM_HPD_HELPDESK_WSDL_DEFN: "integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedyincident"+INTEGRATION_VERSION_NUMBER+"/soap/XM-HPD-HelpDesk-WS-soapui-project.xml",
  XM_HPD_HELPDESK_SOAP_VERSION: "1_1",
  
  /**
   * Initialize the class variables
   * @param wsutil instance of the WSUtil class for making the webservice calls
   * @param endpoint URL of the webservice endpoint
   */
  init: function(wsutil, endpoint)
  {
    this.log = new Logger(this.LOG_SOURCE);
    this.wsutil = wsutil;
    this.endpoint = endpoint;
	this.headers = new HashMap();
	this.headers.put("Host", HOST_HEADER);
  },

  /**
   * Retrieves the incident information for the selected incident. 
   * @param username name of the user making the request
   * @param password string repesenting the user password
   * @param incidentNumber unique identifier for the incident to search for
   * @return instance of the HPDIncident object
   */
  getIncident: function(username, password, incidentNumber)
  {
    this.log.debug("Enter - getIncident");
    var msg = new SOAPMessage(this.XM_HPD_HELPDESK_WSDL_DEFN, "GetIncident", "GetIncident", this.XM_HPD_HELPDESK_SOAP_VERSION);
    msg.setParameter("userName", username);
    msg.setParameter("password", password);
    msg.setParameter("Incident_Number", incidentNumber);

    // Retrieve the incident from Remedy
    var response = this.wsutil.sendReceive(this.endpoint, msg, this.headers);
    var incident = this.wsutil.unmarshall(response.*::GetIncidentResponse, newRemedyObject());
    
    this.log.debug("Exit - getIncident");
    return incident;
  } 
});
