/******************************************************************************/
/*                Start of Data Sync User Object Definition                   */
/******************************************************************************/
var User = xMattersWS.extend({

  LOG_SOURCE: "dataSyncUser.js: ",
  UNKNOWN_USER: "UNKNOWN_USER",
  OK: "OK",

  /**
   * Initialize the class variables
   */
  init: function(targetName)
  {
    this._super();    
    
    this.previousTargetName = "";
    this.active = true;
    this.externallyOwned = false;    
    this.firstName = "NoFirstName";
    this.hasMobileAccess = false;
    this.language = "English";
    this.lastName = "NoLastName";
    this.hasPhoneLogin = false;
    this.phoneLogin = "";
    this.phonePassword = "";
    this.roles = ["Standard User"];
    this.site = "Default Site";
    this.supervisors = ["companyadmin"];
    this.targetName = targetName;
    this.timeZone = "US/Pacific";
    this.ldapDomain = "company.com";
    this.webLogin = "";
    this.webPassword = "password";
    this.webLoginType = "NATIVE";
    this.customAttributes = null;
    this.customFields = null;
    this.userExists = null;
    this.updateOnly = false;
    
    // Populate this instance from the xMatters data if it exists
    var xMattersUserXml = this.query();
    if (this.userExists)
    {
      this.xmlToObject(xMattersUserXml.xmns::QueryUserResponse.child(QName(xmns, "return")).xmns::person);
    }
    
    this.devices = new ArrayList();
  },

  /**
   * Process the roles array and create the role collection for the webservice call
   * @param useNs true if the output XML should be prefixed with the namespace, false otherwise
   * @return String containing XML for the roles node in the webservice call
   */
  getRoles: function(useNs)
  {
    var roleXml = "";
    for (var i=0; i<this.roles.length; i++)
    {
      if (useNs)
      {
        roleXml += "<sch:role><sch:name>" + StringEscapeUtils.escapeXml(this.roles[i]) + "</sch:name></sch:role>";
      }
      else
      {
        roleXml += "<role xsi:type=\"m:SoapRole\"><name xsi:type=\"xsd:string\">" + StringEscapeUtils.escapeXml(this.roles[i]) + "</name></role>";
      }
    }
    return roleXml;
  },

  /**
   * Process the supervisor array and create the supervisor collection for the webservice call
   * @param useNs true if the output XML should be prefixed with the namespace, false otherwise
   * @return String containing XML for the supervisors node in the webservice call
   */
  getSupervisors: function(useNs)
  {
    var supervisorXml = "";
    for (var i=0; i<this.supervisors.length; i++)
    {
      if (useNs)
      {
        supervisorXml += "<sch:supervisor><sch:targetName>" + StringEscapeUtils.escapeXml(this.supervisors[i]) + "</sch:targetName></sch:supervisor>";
      }
      else
      {
        supervisorXml += "<supervisor xsi:type=\"m:SoapSupervisor\"><targetName xsi:type=\"xsd:string\">" + StringEscapeUtils.escapeXml(this.supervisors[i]) + "</targetName></supervisor>";
      }
    }
    return supervisorXml;
  },
  
  /**
   * Iterates the map and creates the XML to populate the custom values for an update user call
   * @param map contains the key/value pairs to be added to the SOAP Request
   * @param nodeName name of the node that will make up the XML node in the return value
   * @return String containing XML for the custom values.
   */
  getCustomValues: function(map, nodeName)
  {
    var valuesXml = "";
    
    if (map != null)
    {
      for (var it = map.keySet().iterator(); it.hasNext();)
      {
        var key = it.next();
        var value = map.get(key);
      
        valuesXml += "<sch:" + nodeName + "><sch:name>" + key + "</sch:name><sch:value>" + StringEscapeUtils.escapeXml(value) + "</sch:value></sch:" + nodeName + ">";
      }
    }
    return valuesXml;
  },
  
  setCustomValues: function(nodeList)
  {
      var map = new HashMap();
      for (var i=0; i<nodeList.length(); i++)
      {
        map.put(nodeList[i].name, nodeList[i].value)
      }
      return map
  },

  /**
   * Add the user to xMatters
   * @return response body from the SOAP Response
   */
  add: function()
  {
    var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "AddUser", "AddUser", this.XM_SOAP_VERSION);
    this.initializeAddOrUpdate(msg, false);
    
    return this.syncSendReceive(this.endPoint, msg, "Add User", this.targetName).xmns::AddUserResponse.child(QName(xmns, "return")).xmns::status;
  },

  /**
   * Update the user in xMatters
   * @return response body from the SOAP Response
   */
  update: function()
  {
    if (this.exists())
    {
      var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "UpdateUser", "UpdateUser", this.XM_SOAP_VERSION);
      this.initializeAddOrUpdate(msg, true);
      
      msg.setParameter("webPassword", "");
      msg.setParameter("previousTargetName", this.previousTargetName);
      msg.setParameter("customAttributes", this.getCustomValues(this.customAttributes, "customAttribute"), false);
      msg.setParameter("customFields", this.getCustomValues(this.customFields, "customField"), false);

      return this.syncSendReceive(this.endPoint, msg, "Update User", this.targetName).xmns::UpdateUserResponse.child(QName(xmns, "return")).xmns::status;
    }
    throw this.UNKNOWN_USER;
  },
  
  /**
   * Delete the user from xMatters
   * @return response body from the SOAP Response
   */
  remove: function()
  {
    if (this.exists())
    {
      var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "DeleteUser", "DeleteUser", this.XM_SOAP_VERSION);
      msg.setParameter("user", this.wsUser);
      msg.setParameter("password", this.wsPassword);
      msg.setParameter("company", this.wsCompany);
      msg.setParameter("targetName", this.targetName);

      return this.syncSendReceive(this.endPoint, msg, "Delete User", this.targetName).xmns::DeleteUserResponse.child(QName(xmns, "return")).xmns::status;
    }
    throw this.UNKNOWN_USER;
  },
  
  /**
   * Private helper function to initialize the values in the SOAP Message for the User Object
   * @param msg instance of SOAPMessage to populate
   * @param useNs true if the output XML should be prefixed with the namespace, false otherwise
   */
  initializeAddOrUpdate: function(msg, useNs)
  {
    msg.setParameter("user", this.wsUser);
    msg.setParameter("password", this.wsPassword);
    msg.setParameter("company", this.wsCompany);
    msg.setParameter("active", this.active);
    msg.setParameter("externallyOwned", this.externallyOwned);
    msg.setParameter("firstName", this.firstName);
    msg.setParameter("hasMobileAccess", this.hasMobileAccess);
    msg.setParameter("language", this.language);
    msg.setParameter("lastName", this.lastName);
    msg.setParameter("hasPhoneLogin", this.hasPhoneLogin);
    msg.setParameter("phoneLogin", this.phoneLogin);
    msg.setParameter("phonePassword", this.phonePassword);
    msg.setParameter("roles", this.getRoles(useNs), false);
    msg.setParameter("site", this.site);
    msg.setParameter("supervisors", this.getSupervisors(useNs), false);
    msg.setParameter("targetName", this.targetName);
    msg.setParameter("timeZone", this.timeZone);
    msg.setParameter("ldapDomain", this.ldapDomain);
    msg.setParameter("webLogin", this.webLogin);
    msg.setParameter("webPassword", this.webPassword);
    msg.setParameter("webLoginType", this.webLoginType);
  },
  
  /**
   * Checks if the user exists in xMatters.
   */
  exists: function()
  {
    if (this.userExists == null)
    {
      this.query();
    }
    return this.userExists;
  },
  
  /**
   * Retrieves the user information for the current user. 
   * @return instance of the user object
   */
  query: function()
  {
    var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "QueryUser", "QueryUser", this.XM_SOAP_VERSION);
    msg.setParameter("user", this.wsUser);
    msg.setParameter("password", this.wsPassword);
    msg.setParameter("company", this.wsCompany);
    msg.setParameter("targetName", this.targetName);

    // Set the userExists value
    this.userExists = false;
    if (this.targetName != "" && this.targetName != null)
    {
      var response = this.sendReceive(this.endPoint, msg);
      this.userExists = this.OK.equalsIgnoreCase(response.xmns::QueryUserResponse.child(QName(xmns, "return")).xmns::status);
      if (this.userExists)
      {
        this.previousTargetName = response.xmns::QueryUserResponse.child(QName(xmns, "return")).xmns::person.xmns::targetName;
      }
      return response;
    }
    return null;
  },
  
  /**
   * Populates this instance from the XML document
   * @param xml instance of the XML document to convert
   */
  xmlToObject: function(xml)
  {
    this.previousTargetName = xml.xmns::targetName;
    this.active = xml.xmns::active;
    this.externallyOwned = xml.xmns::externallyOwned;    
    this.firstName = xml.xmns::firstName;
    this.hasMobileAccess = xml.xmns::hasMobileAccess;
    this.language = xml.xmns::language;
    this.lastName = xml.xmns::lastName;
    this.phoneLogin = xml.xmns::phoneLogin;
    
    this.roles = [];
    for each (var role in xml.xmns::roles)
    {
      this.roles.push(role.xmns::name);
    }
    this.site = xml.xmns::site;

    this.supervisors = [];
    for each (var supervisor in xml.xmns::supervisors)
    {
      this.supervisors.push(supervisor.xmns::supervisor);
    }

    this.customFields = new HashMap();
    for each (var customField in xml.xmns::customFields.xmns::customField)
    {
      this.customFields.put(String(customField.xmns::name), String(customField.xmns::value));
    }
    this.targetName = xml.xmns::targetName;
    this.timeZone = xml.xmns::timeZone;
    this.ldapDomain = xml.xmns::webUserLogin.xmns::ldapDomain;
    this.webLogin = xml.xmns::webUserLogin.xmns::login;
    this.webLoginType = xml.xmns::webUserLogin.xmns::type;
  },
  
  /**
   * Checks that the minimum user information has been provided
   */
  isValid: function()
  {
    return !"".equalsIgnoreCase(this.targetName);
  } 
});