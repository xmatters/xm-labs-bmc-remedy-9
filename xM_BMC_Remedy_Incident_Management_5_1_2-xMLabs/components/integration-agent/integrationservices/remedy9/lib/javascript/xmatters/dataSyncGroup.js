/******************************************************************************/
/*                Start of Data Sync Group Object Definition                  */
/******************************************************************************/
var Group = xMattersWS.extend({

  LOG_SOURCE: "dataSyncGroup.js: ",
  UNKNOWN_GROUP: "UNKNOWN_GROUP",
  OK: "OK",

  /**
   * Initialize the class variables
   */
  init: function(groupName)
  {
    this._super(); 
    this.groupName = groupName;
    this.name = groupName;
    this.active = true;
    this.allowDuplicates = true;
    this.description = "";
    this.externallyOwned = false;
    this.observedByAll = true;
    this.observers = [];
    this.site = "Default Site";
    this.supervisors = ["companyadmin"];
    this.timeZone = "US/Pacific";
    this.useDefaultDevices = true;
    this.team = new Team();
    this.coverage = new Coverage();
    
    this.groupExists = null;
    this.updateOnly = false;

    // Populate this instance from the xMatters data if it exists
    var xMattersGroupXml = this.query();
    if (this.groupExists)
    {
      this.xmlToObject(xMattersGroupXml.xmns::QueryGroupResponse.child(QName(xmns, "return")).xmns::group);
    }

  },

  /**
   * Process the observer array and create the observer collection for the webservice call
   * @return XML containing the group observers
   */
  getObservers: function()
  {
    var observersXml = "";
    for (var i=0; i<this.observers.length; i++)
    {
      observersXml += "<sch:observer><sch:name>" + StringEscapeUtils.escapeXml(this.observers[i]) + "</sch:name></sch:observer>";
    }
    return observersXml;
  },
    
  /**
   * Process the supervisor array and create the supervisor collection for the webservice call
   * @return XML containing the group supervisors
   */
  getSupervisors: function()
  {
    var supervisorsXml = "";
    for (var i=0; i<this.supervisors.length; i++)
    {
      supervisorsXml += "<sch:supervisor><sch:targetName>" + StringEscapeUtils.escapeXml(this.supervisors[i]) + "</sch:targetName></sch:supervisor>";
    }
    return supervisorsXml;
  },

  /**
   * Add the group to xMatters
   * @return response body from the SOAP Response
   */
  add: function()
  {
    var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "AddGroup", "AddGroup", this.XM_SOAP_VERSION);
    this.initializeAddOrUpdate(msg);
    
    return this.syncSendReceive(this.endPoint, msg, "Add Group", this.name).xmns::AddGroupResponse.child(QName(xmns, "return")).xmns::status;
  },

  /**
   * Update the group in xMatters
   * @return response body from the SOAP Response
   */
  update: function()
  {
    if (this.exists())
    {
      var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "UpdateGroup", "UpdateGroup", this.XM_SOAP_VERSION);
      this.initializeAddOrUpdate(msg);
      
      msg.setParameter("groupName", this.groupName);

      return this.syncSendReceive(this.endPoint, msg, "Update Group", this.name).xmns::UpdateGroupResponse.child(QName(xmns, "return")).xmns::status;
    }
    throw this.UNKNOWN_GROUP;
  },
  
  /**
   * Delete the group from xMatters
   * @return response body from the SOAP Response
   */
  remove: function()
  {
    if (this.exists())
    {
      var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "DeleteGroup", "DeleteGroup", this.XM_SOAP_VERSION);
      msg.setParameter("user", this.wsUser);
      msg.setParameter("password", this.wsPassword);
      msg.setParameter("company", this.wsCompany);
      msg.setParameter("groupName", this.name);

      return this.syncSendReceive(this.endPoint, msg, "Delete Group", this.name).xmns::DeleteGroupResponse.child(QName(xmns, "return")).xmns::status;
    }
    throw this.UNKNOWN_GROUP;
  },
  
  /**
   * Private helper function to initialize the values in the SOAP Message for the Group Object
   * @param msg instance of SOAPMessage to populate
   */
  initializeAddOrUpdate: function(msg)
  {
    msg.setParameter("user", this.wsUser);
    msg.setParameter("password", this.wsPassword);
    msg.setParameter("company", this.wsCompany);
    msg.setParameter("active", this.active);
    msg.setParameter("allowDuplicates", this.allowDuplicates);
    msg.setParameter("description", !"".equalsIgnoreCase(this.description) ? this.description : this.name + " Group");
    msg.setParameter("externallyOwned", this.externallyOwned);
    msg.setParameter("name", this.name);
    msg.setParameter("observedByAll", this.observedByAll);
    msg.setParameter("observers", this.getObservers(), false);
    msg.setParameter("site", this.site);
    msg.setParameter("supervisors", this.getSupervisors(), false);
    msg.setParameter("timeZone", this.timeZone);
    msg.setParameter("useDefaultDevices", this.useDefaultDevices);
  },
  
  /**
   * Checks if the group exists in xMatters.
   */
  exists: function()
  {
    if (this.groupExists == null)
    {
      this.query();
    }
    return this.groupExists;
  },

  /**
   * Checks if the group exists in xMatters.
   */
  query: function()
  {
    var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "QueryGroup", "QueryGroup", this.XM_SOAP_VERSION);
    msg.setParameter("user", this.wsUser);
    msg.setParameter("password", this.wsPassword);
    msg.setParameter("company", this.wsCompany);
    msg.setParameter("groupName", this.name);

    var response = this.sendReceive(this.endPoint, msg);
    this.groupExists = this.OK.equalsIgnoreCase(response.xmns::QueryGroupResponse.child(QName(xmns, "return")).xmns::status);
    
    if (this.groupExists)
    {
      var group = response.xmns::QueryGroupResponse.child(QName(xmns, "return")).xmns::group;
      this.groupName = group.xmns::name;
    }
    return response;
   },
  
  /**
   * Checks that the minimum group information has been provided
   */
  isValid: function()
  {
    return !"".equalsIgnoreCase(this.name);
  },
  
  /**
   * Populates this instance from the XML document
   * @param xml instance of the XML document to convert
   */
  xmlToObject: function(xml)
  {
    this.groupName = xml.xmns::name;
    this.name = xml.xmns::name;
    this.active = xml.xmns::active;
    this.allowDuplicates = xml.xmns::allowDuplicates;
    this.description = xml.xmns::description;
    this.externallyOwned = xml.xmns::externallyOwned;    
    this.observedByAll = xml.xmns::observedByAll;
    
    this.observers = [];
    for each(var observer in xml.xmns::observers.xmns::observer)
    {
      this.observers.push(observer.xmns::name);
    }
    this.site = xml.xmns::site;

    this.supervisors = [];
    for each(var supervisor in xml.xmns::supervisors.xmns::supervisor)
    {
      this.supervisors.push(supervisor.xmns::name);
    }
    this.timeZone = xml.xmns::timezone;
    this.useDefaultDevices = xml.xmns::useDefaultDevices;
  }
});
