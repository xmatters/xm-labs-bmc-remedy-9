CALLBACKS = ANNOTATE_DELIVERY ? ["status", "deliveryStatus", "response"] : ["status", "response"]; 

/*
  Called when response object has been received from the form
*/
function apia_callback(msg) {
  
  var str = "Received message from xMatters:";
  str += "\nIncident: " + msg.incident_id;
  str += "\nEvent ID: " + msg.eventidentifier;
  str += "\nCallback type: " + msg.xmatters_callback_type;
  IALOG.debug(str);
  
  try {
  
    switch (msg.xmatters_callback_type) {

      case "response":
        handleResponse(msg);
        break;
        
      case "status":
        handleEventStatus(msg);
        break;
      
      case "deliveryStatus":
        handleDeliveryStatus(msg);
        break;
    }
    
  } catch (e) {
    log.error("apia_callback(" + msg.eventidentifier + ", " + msg.xmatters_callback_type + "): caught Exception - name: [" + e.name + "], message [" + e.message + "]: " + msg);

    throw e;
  }
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * handleEventStatus
 *
 * The main routine for handling event status messages from xMatters
 *
 * ---------------------------------------------------------------------------------------------------------------------
 */
function handleEventStatus(msg)
{
  switch (msg.status) {
  
    case "active":     // event created 
      addAnnotationToIncidentWorkInfo( getIncidentID(msg), notePrefix + "Event " + msg.eventidentifier + " successfully created in xMatters" );
      break;
      
    case "terminated": // time expired 
      addAnnotationToIncidentWorkInfo( getIncidentID(msg), notePrefix + "Event " + msg.eventidentifier + " terminated" );
      break;
      
    case "terminated_external": // terminated by user
      var incidentId = getIncidentID(msg);

      if (msg.username !== INITIATOR_USER_ID) {
        addAnnotationToIncidentWorkInfo( incidentId, notePrefix + "Event " + msg.eventidentifier + " manually terminated from within xMatters" 
          /* + " by user [" + msg.username + "]" */ );
      } else {
        // Ignore the events created and terminated by this integration and not the actual user
        log.info("handleEventStatus - incidentId [" + incidentId + "] event terminated by the user that initiated the event. Ignored.");
      }
      break;      
  }
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * handleDeliveryStatus
 *
 * The main routine for handling delivery status messages from xMatters
 *
 * If an message is delivered successfully, a comment is added to the worklog of the Remedy Incident ticket quoting the user and device that was targeted
 * If an message delivery fails, a comment is added to the worklog of the Remedy Incident ticket quoting the user and device that was targeted
 * ---------------------------------------------------------------------------------------------------------------------
 */
function handleDeliveryStatus(msg)
{
  if ( ANNOTATE_DELIVERY && msg.deliverystatus ) {
    switch (String(msg.deliverystatus).toLowerCase()) {
    
      case "delivered":
        addAnnotationToIncidentWorkInfo( getIncidentID(msg), notePrefix + "Notification delivered successfully to " + msg.recipient + " | " + msg.device);
        break;
        
      case "failed": 
        addAnnotationToIncidentWorkInfo( getIncidentID(msg), notePrefix + "Unable to deliver notification to " + msg.recipient + " | " + msg.device);
        break;
    }
  }
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * handleResponse
 *
 * The main routine for handling user responses
 *
 * ---------------------------------------------------------------------------------------------------------------------
 */
function handleResponse(msg)
{
  log.debug("Enter - handleResponse");

  var addResponseAnnotations = true;

  var responder = msg.recipient;
  var device = msg.device;
  
  log.debug("handleResponse - Event ID " + msg.eventidentifier + ", response [" + msg.response + "], responder [" + responder + "], device [" + device + "]");

  var incidentId = getIncidentID( msg );
  var userAnnotation = "null".equals(msg.annotation) ? null : msg.annotation;

  log.info("handleResponse - Event ID " + msg.eventidentifier + ", incidentId [" + incidentId + "], annotation [" + userAnnotation + "]");

  var incidentService = new XMHPDIncidentInterfaceWS(new WSUtil(), XM_HPD_INCIDENT_WS_URL);

  switch (String(msg.response).toUpperCase()) {
  
    case RESPONSE_ACTION_ACCEPT:
      var incident = getIncident( incidentId );

      // First set the assignee, add a annotation and push to Remedy
      Incident.setAssignee(incident, responder);
      Incident.setWorkLog(incident, addResponseAnnotations, notePrefix + "Response " + msg.response + " received from " + responder, userAnnotation);

      incidentService.updateAssignee(REMEDY_WS_USERNAME, REMEDY_WS_PASSWORD, incident);

      // Then change the status to 'In Progress', add another annotation and push the second update to Remedy
      Incident.setStatus(incident);
      Incident.setWorkLog(incident, addResponseAnnotations, notePrefix + "Incident status changed to 'In Progress'", null);

      incidentService.updateStatus(REMEDY_WS_USERNAME, REMEDY_WS_PASSWORD, incident);
      break;

    case RESPONSE_ACTION_RESOLVE:
      var incident = getIncident( incidentId );

      // First set the assignee, add a annotation and push to Remedy
      Incident.setAssignee(incident, responder);
      Incident.setWorkLog(incident, addResponseAnnotations, notePrefix + "Response " + msg.response + " received from " + responder, userAnnotation);
      
      incidentService.updateAssignee(REMEDY_WS_USERNAME, REMEDY_WS_PASSWORD, incident);

      Incident.setResolved(incident);
      Incident.setWorkLog(incident, addResponseAnnotations, notePrefix + "Incident status changed to 'Resolved'", null);

      incidentService.resolve(REMEDY_WS_USERNAME, REMEDY_WS_PASSWORD, incident);
      break;

    case RESPONSE_ACTION_IGNORE:
    case RESPONSE_ACTION_ACKNOWLEDGE:
    case RESPONSE_ACTION_ACK:
      // Don't need to retrieve the incident from Remedy for this response, but need the ID set up
      var incident = newRemedyObject();
      incident.Incident_Number = incidentId;
      Incident.setWorkLog(incident, addResponseAnnotations, notePrefix + "Response " + msg.response + " received from " + responder /* + " | " + device */, userAnnotation);
      
      incidentService.addWorkLog(REMEDY_WS_USERNAME, REMEDY_WS_PASSWORD, incident);
      break;

    default:
      throw { name: "HandleResponseException", message: "Unknown response [" + msg.response + "]"};
  }

  log.debug("handleResponse - returning incident [" + incident + "]");
  log.debug("Exit - handleResponse");
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * addAnnotationToIncidentWorkInfo
 *
 * Add an annotation as a result of the event injection processing. Catch any exceptions thrown.
 *
 * @param incidentId
 * @param summary
 * @param note
 * ---------------------------------------------------------------------------------------------------------------------
 */
function addAnnotationToIncidentWorkInfo(incidentId, summary, note)
{
    log.debug("Enter - addAnnotationToIncidentWorkInfo");
    log.info("addAnnotationToIncidentWorkInfo - incidentId [" + incidentId + "], summary [" + summary + "]");

    try
    {
      var incidentService = new XMHPDIncidentInterfaceWS(new WSUtil(), XM_HPD_INCIDENT_WS_URL);
      
      var incident = newRemedyObject();
      incident.Incident_Number = incidentId;
      
      Incident.setWorkLog(incident, true, summary, note);
      incidentService.addWorkLog(REMEDY_WS_USERNAME, REMEDY_WS_PASSWORD, incident);
      
    } catch (e)
    {
        log.error("Failed to annotate incident: Exception - name [" + e.name + "], message [" + e.message + "]");
        log.error("Incident ID [" + incidentId + "]");
    }

    log.debug("Exit - addAnnotationToIncidentWorkInfo");
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * getIncidentID
 *
 * Check whether additionalTokens and Incident_Number are present, and return the content if they are. 
 * If not, an exception is thrown.
 *
 * @param msg
 * ---------------------------------------------------------------------------------------------------------------------
 */
function getIncidentID( msg ) {
  
  if ('additionalTokens' in msg) {
    
    if (INT_PROPERTY_TICKET_ID in msg.additionalTokens) 
      return msg.additionalTokens[INT_PROPERTY_TICKET_ID];
    
    if (PROPERTY_TICKET_ID in msg.additionalTokens) 
      return msg.additionalTokens[PROPERTY_TICKET_ID];
  }
  
  throw { name: "DataException", message: "Property that identifies the incident is not found in event callback data of type " + msg.xmatters_callback_type + " for event ID " + msg.eventidentifier 
    + ".Make sure 'Include in Callbacks' is set in the form's layout for a property configured as PROPERTY_TICKET_ID (or INT_PROPERTY_TICKET_ID, for integrated properties) in configuration.js"};  
}

function getIncident( incidentId ) {
  var helpDeskService = new XMHPDHelpDeskWS(new WSUtil(), XM_HPD_HELPDESK_WS_URL);
  
  var incident = helpDeskService.getIncident(REMEDY_WS_USERNAME, REMEDY_WS_PASSWORD, incidentId);
  if (incident == null)
  {
      throw { name: "HandleResponseException", message: "Incident [" + incidentId + "] not found in Remedy"};
  }

  return incident;
}