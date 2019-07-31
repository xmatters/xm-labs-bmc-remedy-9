/*
  Called when object is being injected by APClient.Bin or via HTTP
*/
function apia_event(formObject) {

  // A workaround for 'form properties of type List rejecting empty values' issue
  for (var property in formObject.properties) {
    if (formObject.properties[property] === "") {
      formObject.properties[property] = null;
    }
  }

	return formObject;	
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * http_event - called by apia_http() implementation
 *
 * @param requestBody - the body of the HTTP Request
 * ---------------------------------------------------------------------------------------------------------------------
 */
function http_event(requestBody) {
  log.debug("Enter - http_event");
  log.debug("http_event: request body [" + requestBody + "]");

  var request = parseCheckRequestBody( new XML( new WSUtil().formatStringForE4X( requestBody ) ) );
  
  log.info("http_event: action [" + request.action + "], incidentId [" + request.incidentId + "], form [" + request.form + "]");
    
  if (equalsIgnoreCase(request.action, REQUEST_ACTION_DELETE)) {
    // Remedy will send requests with the delete action when an incident is set to resolved or closed.
    log.info("http_event - deleting incident [" + request.incidentId + "]");
    
    var count = XMRESTAPI.deleteEvents( getExistingEventsFilter( request.incidentId ) );
    log.info("http_event: SUCCESS. Events terminated: " + count); // deleteEvents will throw exception if something is wrong
    
    if ( count > 0 && ! isEmpty(request.logMessage) ) {
      // Add the message to the incident work log
      addAnnotationToIncidentWorkInfo( request.incidentId, notePrefix + request.logMessage, null );
    }
    
  } else {

    // Retrieve incident details from Remedy
    var helpDeskService = new XMHPDHelpDeskWS(new WSUtil(), XM_HPD_HELPDESK_WS_URL);
    var incidentService = new XMHPDIncidentInterfaceWS(new WSUtil(), XM_HPD_INCIDENT_WS_URL);

    var incident = helpDeskService.getIncident(REMEDY_WS_USERNAME, REMEDY_WS_PASSWORD, request.incidentId);
    if (incident == null) {
      throw ("incident [" + request.incidentId + "] not found in Remedy");
    } 
    
    log.debug("http_event: retrieved incident " + incident.Incident_Number);        
    
    // Get URL of the xMatters form that will handle this request
    var form = getFormURL(request);

    // Convert incident details into APXML
    var apxml = makeApxmlFrom(incident, request.form);
    if (log.isDebugEnabled()) {
      log.debug("incident [" + request.incidentId + "] converted to APXML: " + APXML.toString(apxml));    
    }

    // Submit APXML
    var response = XMRESTAPI.submitApxml(form, apxml, DELETE_EXISTING_EVENTS ? getExistingEventsFilter(incident.Incident_Number) : null, { 'priority' : 'xm_priority' });
    
    if (response) {
      // if request was actually sent
      if (response.status == XMRESTAPI.RESPONSE_SUCCESS || response.status == XMRESTAPI.RESPONSE_SUCCESS_ACCEPTED) {
        log.debug("http_event: SUCCESS");
        // If submitApxmlAsRest() actually sent the message and didn't deduplicate it, add an annotation to the incident.
        var recipients = JSON.parse(apxml.getValue("recipients"))[0].targetName;
        Incident.setWorkLog(incident, true, notePrefix + "Notification will be sent to [" + recipients + "]", null);
        incidentService.addWorkLog(REMEDY_WS_USERNAME, REMEDY_WS_PASSWORD, incident);
      } else {
        log.info("http_event: FAILURE (" + response.status + ")");      
        XMRESTAPI.checkResponse( response );
      }
    }
  }
 
  log.debug("Exit - http_event");
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * makeApxmlFrom
 *
 * @param incident - the object received from Remedy
 * ---------------------------------------------------------------------------------------------------------------------
 */
function makeApxmlFrom(incident, form)
{
  var functionName = "makeApxmlFrom";
  log.debug("Enter - " + functionName);
  log.info(functionName + " - incident [" + incident + "]");

  var apxml = ServiceAPI.createAPXML();
  
  // -----------------------------------------------------------------------------------------------------------------
  // Set up the APXML tokens that have the same names and values as the Remedy incident properties
  // -----------------------------------------------------------------------------------------------------------------
  new xMattersWS().addEventTokensFromObject(apxml, incident);

  // Set up recipients and responses
  var recipients;
  var response_options;

  if ( isEmpty(incident.Assignee_Login_ID) ) {
    recipients = buildXmattersGroupName(incident.Assigned_Support_Company, incident.Assigned_Support_Organization, incident.Assigned_Group);
    response_options = RESPONSE_OPTIONS_WHEN_ASSIGNED_TO_GROUP;
  } else {
    recipients = incident.Assignee_Login_ID;
    response_options = RESPONSE_OPTIONS_WHEN_ASSIGNED_TO_USER;
  }
  
  log.info(functionName + ": recipients [" + recipients + "]");
  apxml.setToken("recipients", "[{\"targetName\":\"" + recipients + "\"}]");  // expected by APXML.toJSON as an array of objects

  log.info(functionName + ": form [" + form + "]");
  var responses = getResponseOptions( response_options, form );

  if (responses != null) {
    log.info(functionName + ": responses [" + responses.length + "]");
    apxml.setToken("xmresponses", JSON.stringify(responses));
  }
  
  // Add the priority event token to set the priority of the event in xMatters On-Demand
  var priority;
  switch (String(incident.Priority).toLowerCase()) {
    case "critical" :
      priority = "high";
      break;
    case "high" :
      priority = "medium";
      break;
    default :
      priority = "low";
  }
  log.info(functionName + ": xm_priority [" + priority + "]");
  apxml.setToken("xm_priority", priority);
  
  // Add agent_client_id token required for responses
  var agent = getAgentClientID();
  log.info(functionName + ": agent_client_id [" + agent + "]");
  apxml.setToken("agent_client_id", agent);

  log.debug("Exit - " + functionName);

  return apxml;
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * Retrieves URL of the form request is to be submitted
 *
 * @param request - JS object for parameters received from Remedy
 * ---------------------------------------------------------------------------------------------------------------------
 */
function getFormURL(request) {

  if ( !isEmpty(request.form) ) {
    // The target form is specified in the request
    var form = FORMS[request.form]; 
    
    if (isEmpty(form)) {
      throw "The URL for form '" + request.form + "' is not configured. Check the configuration file";
    }
    
    return XMRESTAPI.getFormURL(WEB_SERVICE_URL, form);
  }
  
  // Otherwise, use the default form 
  return WEB_SERVICE_URL; 
}

function getResponseOptions( response_options, form ) {
  var functionName = "getResponseOptions";
  log.debug("Enter - " + functionName);

  if ( response_options[form] ) {
    log.debug(functionName + " - " + response_options[form].length + " responses for form [" + form + "]");
    return response_options[form];
  }
  
  log.warn(functionName + " - all responses defined in the form will be available");  
  log.debug("Exit - " + functionName);
  
  return null;
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * parseCheckRequestBody
 *
 * Parse the HTML request body, check that the expected parameters were found and return a Javascript object that
 * contains the request parameters.
 * ---------------------------------------------------------------------------------------------------------------------
 */
function parseCheckRequestBody(requestBody)
{
    log.debug("Enter - parseCheckRequestBody: " + (typeof requestBody) + " \n" + requestBody);

    var request = new Object();

    request.action = String(requestBody.*::Body.*::TriggerRequest.*::action);
    request.incidentId = String(requestBody.*::Body.*::TriggerRequest.*::id);
    request.form = String(requestBody.*::Body.*::TriggerRequest.*::form);
    request.logMessage = String(requestBody.*::Body.*::TriggerRequest.*::message);

    log.debug("parseCheckRequestBody: Received action=" + request.action + ", incidentId=" + request.incidentId + ", form=" + request.form + ", logMessage=" + request.logMessage);

    if (isEmpty(request.action))
    {
        throw "Request action not found."
    }

    if (isEmpty(request.incidentId))
    {
        throw "Request incidentId not found."
    }
    
    log.debug("Exit - parseCheckRequestBody");
    return request;
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * getExistingEventsFilter
 *
 * return a Javascript object that contains the event filter parameters 
 * ---------------------------------------------------------------------------------------------------------------------
 */
function getExistingEventsFilter(incidentId) {
  return { status : "ACTIVE", properties : { 'incident_number#en' : incidentId } } 
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * getAgentClientID
 *
 * return agent_client_id of the integration
 * ---------------------------------------------------------------------------------------------------------------------
 */
function getAgentClientID() {
	if (ServiceAPI.getConfiguration === undefined)
		return "applications|bmcremedyincident" + INTEGRATION_VERSION_NUMBER; 
	else
		return ServiceAPI.getConfiguration().getName(); 
}