var USER_SUPPORT_GROUP_QUALIFICATION = "'Login ID' = \"${Assignee_Login_ID}\" AND (('Company' = \"${Assigned_Support_Company}\" AND 'Support Organization' = \"${Assigned_Support_Organization}\" AND 'Support Group Name' = \"${Assigned_Group}\") OR 'Default' = \"Yes\")";

var INCIDENT_ACTION_MODIFY = "MODIFY";

var WORK_LOG_TYPE = "xMatters";
var WORK_INFO_TYPE = "Working Log";
var WORK_INFO_VIEW_ACCESS = "Internal";
var WORK_INFO_LOCKED = "Yes";
var WORK_INFO_SUMMARY_FIELD_LENGTH = 100;

var RESOLVED_STATUS_REASON = "No Further Action Required";
var RESOLVED_RESOLUTION = "Ticket is resolved";
var CONFIG_RESOLUTION_CATEGORY = "";
var CONFIG_RESOLUTION_CATEGORY_TIER_2  = "";
var CONFIG_RESOLUTION_CATEGORY_TIER_3 = "";
var RESOLVED_RESOLUTION_METHOD = "Self-Service";

Incident = {};

(function(){

  /**
   * ---------------------------------------------------------------------------------------------------------------------
   * setIncidentWorkLog
   *
   * set the fields in the incident associated with the annotations from the user and xMatters, dependant on the value
   * of addResponseAnnotations
   *
   * ---------------------------------------------------------------------------------------------------------------------
   */
 	Incident.setWorkLog = function(incident, addResponseAnnotations, summary, notes) {
    log.debug("Enter - setIncidentWorkLog");
    log.info("setIncidentWorkLog - summary [" + summary + "], notes [" + notes + "]");

    if (addResponseAnnotations)
    {
        if (!isEmpty(summary) || !isEmpty(notes))
        {
            incident.Action = INCIDENT_ACTION_MODIFY;

            incident.Work_Info_Type = WORK_INFO_TYPE;
            incident.Work_Info_Locked = WORK_INFO_LOCKED;
            incident.Work_Info_View_Access = WORK_INFO_VIEW_ACCESS;

            // The summary field:
            // - is a limited char field in Remedy (default: 100)
            // - is not supported in Remedy 7.6.04 onwards, so both the summary and notes are concatenated
            //   and written to the notes field.
            if (!isEmpty(summary))
            {
                incident.Work_Info_Summary = summary;
		        incident.Work_Info_Notes = summary + ". "
            }

            if (!isEmpty(notes))
            {
                incident.Work_Info_Notes += notes;
            }
        }
    }

    log.debug("Exit - setIncidentWorkLog");
}

  /**
   * ---------------------------------------------------------------------------------------------------------------------
   * setIncidentResolved
   *
   *
   *
   * ---------------------------------------------------------------------------------------------------------------------
   */
  Incident.setResolved = function(incident)
  {
      log.debug("Enter - setIncidentResolved");
      log.info("setIncidentResolved - incident [" + incident + "]");

      incident.Action = INCIDENT_ACTION_MODIFY;
      incident.Resolution = RESOLVED_RESOLUTION;

      incident.Resolution_Method = RESOLVED_RESOLUTION_METHOD;
      incident.Status = STATUS_RESOLVED;
      incident.Status_Reason = STATUS_REASON;

      log.debug("Exit - setIncidentResolved");
  };

  /**
   * ---------------------------------------------------------------------------------------------------------------------
   * setIncidentAssignee
   *
   * @param incident
   * @param assigneeLoginId
   * ---------------------------------------------------------------------------------------------------------------------
   */
  Incident.setAssignee = function setIncidentAssignee(incident, assigneeLoginId) {
      log.debug("Enter - setIncidentAssignee");
      log.info("setIncidentAssignee - incident [" + incident + "], assigneeLoginId [" + assigneeLoginId + "]");

      // Initialize the incident object for the update
      incident.Action = INCIDENT_ACTION_MODIFY;
      incident.Assignee_Login_ID = assigneeLoginId;

      // We want to update the incident to be assigned to the responder so let's get their details
      var supportGroupAssocService = new XMSupGrpAssoc(new WSUtil(), XM_SUPPORTGROUPASSOC_WS_URL);

      var qualification = USER_SUPPORT_GROUP_QUALIFICATION
          .replace("${Assignee_Login_ID}", incident.Assignee_Login_ID)
          .replace("${Assigned_Support_Company}", incident.Assigned_Support_Company)
          .replace("${Assigned_Support_Organization}", incident.Assigned_Support_Organization)
          .replace("${Assigned_Group}", incident.Assigned_Group);

      log.debug("function - qualification [" + qualification + "]");

      var groupMemberInfoList = supportGroupAssocService.getGroupMemberInfoList(REMEDY_WS_USERNAME, REMEDY_WS_PASSWORD, qualification, "", "");

      var defaultAssignment = null;
      var found = false;

      for each (var item in groupMemberInfoList)
      {
          incident.Assignee = item.Full_Name;
          incident.Assigned_Group_ID = String(item.Support_Group_ID);

          log.debug("Default: " + item.Default);

          // Check to see if the current assignment info matches that in the incident...
          if (item.Company == incident.Assigned_Support_Company
              && item.Support_Organization == incident.Assigned_Support_Organization
              && item.Support_Group_Name == incident.Assigned_Group)
          {
              // We have a match, so there is no need to update the incident
              log.debug("User is in the current assignment group...no change");
              found = true;
              break;
          }

          // Store the first default assignment information we come to...
          if (item.Default == "Yes" && defaultAssignment == null)
          {
              log.debug("Setting the default assigment information");

              defaultAssignment = newRemedyObject();
              defaultAssignment.Assigned_Support_Company = String(item.Company);
              defaultAssignment.Assigned_Support_Organization = String(item.Support_Organization);
              defaultAssignment.Assigned_Group = String(item.Support_Group_Name);
              defaultAssignment.Assigned_Group_ID = String(item.Support_Group_ID);

              log.debug("Default Assignment: " + defaultAssignment.toString());
          }
      }

      // The assignment group was not found, so use the default...
      if (!found)
      {
          if (defaultAssignment == null)
          {
              throw("Remedy user has no default assignment.");
          }

          log.debug("Updating the incident to use the default assignment");
          incident.Assigned_Support_Company = defaultAssignment.Assigned_Support_Company;
          incident.Assigned_Support_Organization = defaultAssignment.Assigned_Support_Organization;
          incident.Assigned_Group = defaultAssignment.Assigned_Group;
          incident.Assigned_Group_ID = defaultAssignment.Assigned_Group_ID;
      }

      log.debug("Exit - setIncidentAssignee");
  };

  /**
   * ---------------------------------------------------------------------------------------------------------------------
   * setIncidentStatus
   *
   *
   *
   * ---------------------------------------------------------------------------------------------------------------------
   */
  Incident.setStatus = function setStatus(incident) {
      log.debug("Enter - setIncidentStatus");
      log.info("setIncidentStatus - incident [" + incident + "]");

      incident.Action = INCIDENT_ACTION_MODIFY;
      incident.Status = STATUS_IN_PROGRESS;

      log.debug("Exit - setIncidentStatus");
  };

})();