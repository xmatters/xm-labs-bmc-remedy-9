/******************************************************************************/
/*            Start of Remedy XM_HPD_IncidentInterface WS Definition          */
/******************************************************************************/
var XMHPDIncidentInterfaceWS = BaseClass.extend({

  LOG_SOURCE: "xm-hpd-incident-interface-ws.js: ",
  XM_HPD_INCIDENT_INTERFACE_WSDL_DEFN: "integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/remedyincident" + INTEGRATION_VERSION_NUMBER + "/soap/XM-HPD-IncidentInterface-WS-soapui-project.xml",
  XM_HPD_INCIDENT_INTERFACE_SOAP_VERSION: "1_1",
  
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
   * Update the incident assignee in Remedy
   * @param username name of the user making the request
   * @param password string repesenting the user password
   * @param incident instance of the incident to update
   */
  updateAssignee: function(username, password, incident)
  {
    this.log.debug("Enter - updateAssignee");

    var msg = new SOAPMessage(this.XM_HPD_INCIDENT_INTERFACE_WSDL_DEFN, "UpdateAssignee", "UpdateAssignee", this.XM_HPD_INCIDENT_INTERFACE_SOAP_VERSION);
    msg.setParameter("userName", username);
    msg.setParameter("password", password);
    msg.setParameter("Action", incident.Action);
    msg.setParameter("Assignee", incident.Assignee);
    msg.setParameter("Assignee_Login_ID", incident.Assignee_Login_ID);
    msg.setParameter("Assigned_Support_Company", incident.Assigned_Support_Company);
    msg.setParameter("Assigned_Support_Organization", incident.Assigned_Support_Organization);
    msg.setParameter("Assigned_Group", incident.Assigned_Group);
    msg.setParameter("Assigned_Group_ID", incident.Assigned_Group_ID);
    msg.setParameter("Work_Info_Summary", getNonNullValue(incident.Work_Info_Summary));
    msg.setParameter("Work_Info_Notes", getNonNullValue(incident.Work_Info_Notes));
    msg.setParameter("Work_Info_Type", getNonNullValue(incident.Work_Info_Type));
    msg.setParameter("Work_Info_Source", getNonNullValue(incident.Work_Info_Source));
    msg.setParameter("Work_Info_Locked", getNonNullValue(incident.Work_Info_Locked));
    msg.setParameter("Work_Info_View_Access", getNonNullValue(incident.Work_Info_View_Access));
    msg.setParameter("Incident_Number", incident.Incident_Number);
    
    // Update the incident assignee in Remedy
    this.log.debug("Exit - updateAssignee");
    this.wsutil.sendReceive(this.endpoint, msg, this.headers);
  },

  /**
   * Update the incident status in Remedy
   * @param username name of the user making the request
   * @param password string repesenting the user password
   * @param incident instance of the incident to update
   */
  updateStatus: function(username, password, incident)
  {
    this.log.debug("Enter - updateStatus");

    var msg = new SOAPMessage(this.XM_HPD_INCIDENT_INTERFACE_WSDL_DEFN, "UpdateStatus", "UpdateStatus", this.XM_HPD_INCIDENT_INTERFACE_SOAP_VERSION);
    msg.setParameter("userName", username);
    msg.setParameter("password", password);
    msg.setParameter("Action", incident.Action);
    msg.setParameter("Status", incident.Status);
    msg.setParameter("Work_Info_Summary", getNonNullValue(incident.Work_Info_Summary));
    msg.setParameter("Work_Info_Notes", getNonNullValue(incident.Work_Info_Notes));
    msg.setParameter("Work_Info_Type", getNonNullValue(incident.Work_Info_Type));
    msg.setParameter("Work_Info_Source", getNonNullValue(incident.Work_Info_Source));
    msg.setParameter("Work_Info_Locked", getNonNullValue(incident.Work_Info_Locked));
    msg.setParameter("Work_Info_View_Access", getNonNullValue(incident.Work_Info_View_Access));
    msg.setParameter("Incident_Number", incident.Incident_Number);
    
    // Update the incident status in Remedy
    this.log.debug("Exit - updateStatus");
    this.wsutil.sendReceive(this.endpoint, msg, this.headers);
  },
  
  /**
   * Resolve the incident in Remedy
   * @param username name of the user making the request
   * @param password string repesenting the user password
   * @param incident instance of the incident to update
   */
  resolve: function(username, password, incident)
  {
    this.log.debug("Enter - resolve");

    var msg = new SOAPMessage(this.XM_HPD_INCIDENT_INTERFACE_WSDL_DEFN, "Resolve", "Resolve", this.XM_HPD_INCIDENT_INTERFACE_SOAP_VERSION);
    msg.setParameter("userName", username);
    msg.setParameter("password", password);
    msg.setParameter("Action", incident.Action);
    msg.setParameter("Resolution", incident.Resolution);
    msg.setParameter("Resolution_Category", incident.Resolution_Category);
    msg.setParameter("Resolution_Category_Tier_2", incident.Resolution_Category_Tier_2);
    msg.setParameter("Resolution_Category_Tier_3", incident.Resolution_Category_Tier_3);
    msg.setParameter("Resolution_Method", incident.Resolution_Method);
    msg.setParameter("Status", incident.Status);
    msg.setParameter("Status_Reason", incident.Status_Reason);
    msg.setParameter("Work_Info_Summary", getNonNullValue(incident.Work_Info_Summary));
    msg.setParameter("Work_Info_Notes", getNonNullValue(incident.Work_Info_Notes));
    msg.setParameter("Work_Info_Type", getNonNullValue(incident.Work_Info_Type));
    msg.setParameter("Work_Info_Source", getNonNullValue(incident.Work_Info_Source));
    msg.setParameter("Work_Info_Locked", getNonNullValue(incident.Work_Info_Locked));
    msg.setParameter("Work_Info_View_Access", getNonNullValue(incident.Work_Info_View_Access));
    msg.setParameter("Incident_Number", incident.Incident_Number);
    
    // Resolve the incident in Remedy
    this.wsutil.sendReceive(this.endpoint, msg, this.headers);
    this.log.debug("Exit - resolve");
  },

  /**
   * Add a worklog entry to the incident in Remedy
   * @param username name of the user making the request
   * @param password string repesenting the user password
   * @param incident instance of the incident to update
   */
  addWorkLog: function(username, password, incident)
  {
    this.log.debug("Enter - addWorkLog");

    var msg = new SOAPMessage(this.XM_HPD_INCIDENT_INTERFACE_WSDL_DEFN, "AddWorkLog", "AddWorkLog", this.XM_HPD_INCIDENT_INTERFACE_SOAP_VERSION);
    msg.setParameter("userName", username);
    msg.setParameter("password", password);
    msg.setParameter("Action", incident.Action);
    msg.setParameter("Work_Info_Summary", getNonNullValue(incident.Work_Info_Summary).substring(0,WORK_INFO_SUMMARY_FIELD_LENGTH - 1));
    msg.setParameter("Work_Info_Notes", getNonNullValue(incident.Work_Info_Notes));
    msg.setParameter("Work_Info_Type", getNonNullValue(incident.Work_Info_Type));
    msg.setParameter("Work_Info_Source", getNonNullValue(incident.Work_Info_Source));
    msg.setParameter("Work_Info_Locked", getNonNullValue(incident.Work_Info_Locked));
    msg.setParameter("Work_Info_View_Access", getNonNullValue(incident.Work_Info_View_Access));
    msg.setParameter("Incident_Number", incident.Incident_Number);
    
    // Update the incident assignee in Remedy
    this.wsutil.sendReceive(this.endpoint, msg, this.headers);
    this.log.debug("Exit - addWorkLog");
  }
  
});
