// ----------------------------------------------------------------------------------------------------
// Configuration settings for an xMatters Relevance Engine Integration
// ----------------------------------------------------------------------------------------------------

// ----------------------------------------------------------------------------------------------------
// This value determines the form that will be used to inject events into xMatters if no form parameter
// is present in the request. The retrieve or terminate event requests are also based on this URL
// ----------------------------------------------------------------------------------------------------
var WEB_SERVICE_URL = "<Inbound Integration Builder URL of New Incident Alerts>";

// ----------------------------------------------------------------------------------------------------
// REST Web Service Detail
// ----------------------------------------------------------------------------------------------------

var BASE_URL ="https://<company-name>.xmatters.com";
var XM_API_URL = "/api/xm/1/";

//----------------------------------------------------------------------------------------------------
// Access Web Service URLs of "BMC Remedy ITSM - Incident" relevance engine forms used to inject events
//
// Format : '<Form parameter value passed from Remedy filter>' : "<Form's Access Web Service URL>"
//----------------------------------------------------------------------------------------------------

var FORMS = {
  'Incident Priority Upgrade Alerts' : "",
               'New Incident Alerts' : "",
          'Reopened Incident Alerts' : "",
        'Reassigned Incident Alerts' : "",
                        'SLM Alerts' : "",
};

//----------------------------------------------------------------------------------------------------
// The Web Login ID used to authenticate the request to xMatters. The user's password should be encrypted
// using the iapassword.sh utility. Please see the integration agent documentation for instructions.
//----------------------------------------------------------------------------------------------------
var INITIATOR = "remedyincident";
var INITIATOR_PASSWORD_FILE = "conf/.initiatorpasswd";

//----------------------------------------------------------------------------------------------------
// The User ID of the user used to authenticate the request to xMatters. Default value is "Remedy"
//----------------------------------------------------------------------------------------------------
var INITIATOR_USER_ID = "Remedy";

//----------------------------------------------------------------------------------------------------
// Name of the filter from conf/deduplicator-filter.xml to be used to detect duplicate events
//----------------------------------------------------------------------------------------------------
var DEDUPLICATION_FILTER_NAME = "remedyincident-5-1-2";

//----------------------------------------------------------------------------------------------------
// Terminate existing xMatters events associated with the incident before injecting a new one
//----------------------------------------------------------------------------------------------------
var DELETE_EXISTING_EVENTS = true;

//----------------------------------------------------------------------------------------------------
// Create a worklog entry to the Remedy Incident ticket when notification is delivered to the user
//----------------------------------------------------------------------------------------------------
var ANNOTATE_DELIVERY = true;

//----------------------------------------------------------------------------------------------------
// Web Service credentials
//
// Credentials for accessing the XM_CTM_xxx Web service will be stored in
// a separate password file created using iapassword.bat
//----------------------------------------------------------------------------------------------------
var REMEDY_WS_USERNAME = "xmatters";
var REMEDY_WS_PASSWORD_FILE = "conf/xm_hpd_ws.pwd"; // "conf/.passwd";

var PROTOCOL = "http";
var MID_TIER_HOSTNAME = "localhost"; // usually 'localhost'
var MID_TIER_PORT = "8080";
var REMEDY_SERVER_NAME = "vic-vw-remedy8";

var XM_HPD_HELPDESK_WS_URL = PROTOCOL + "://" + MID_TIER_HOSTNAME + ":" + MID_TIER_PORT + "/arsys/services/ARService?server=" + REMEDY_SERVER_NAME + "&webService=XM_HPD_HelpDesk_WS";
var XM_HPD_INCIDENT_WS_URL = PROTOCOL + "://" + MID_TIER_HOSTNAME + ":" + MID_TIER_PORT + "/arsys/services/ARService?server=" + REMEDY_SERVER_NAME + "&webService=XM_HPD_IncidentInterface_WS";
var XM_SUPPORTGROUPASSOC_WS_URL = PROTOCOL + "://" + MID_TIER_HOSTNAME + ":" + MID_TIER_PORT + "/arsys/services/ARService?server=" + REMEDY_SERVER_NAME + "&webService=XM_SupportGrp_SupportGrpAssoci_WS";

// The "Host" header value which will be sent for the HTTP WS POST to the Remedy Midtier Server
var HOST_HEADER = MID_TIER_HOSTNAME;

//----------------------------------------------------------------------------------------------------
// Response options when incident is assigned to the user.
//
// Format : '<Form parameter value passed from Remedy filter>' : [ '<Response Identifier>', ... ]
//
// Example: 'New Incident Alerts' : [ '13ca2237-e5ff-4de7-baa8-2b3fd0a79cb6', '51d1d628-ed90-4668-8417-0877f3cf6791' ]
//----------------------------------------------------------------------------------------------------

RESPONSE_OPTIONS_WHEN_ASSIGNED_TO_USER = {

  // Out of the box, only Accept and Resolve response options are available when incident is assigned to the user

  'Incident Priority Upgrade Alerts' : [ '<Access Response Identifier>', '<Resolve Response Identifier>' ],
               'New Incident Alerts' : [ '<Access Response Identifier>', '<Resolve Response Identifier>' ],
          'Reopened Incident Alerts' : [ '<Access Response Identifier>', '<Resolve Response Identifier>' ],
        'Reassigned Incident Alerts' : [ '<Access Response Identifier>', '<Resolve Response Identifier>' ],
                        'SLM Alerts' : [ '<Access Response Identifier>', '<Resolve Response Identifier>' ]
};

//----------------------------------------------------------------------------------------------------
// Response options when incident is assigned to the group.
//
// Format : '<Form parameter value passed from Remedy filter>' : [ '<Response Identifier>', ... ]
//----------------------------------------------------------------------------------------------------

RESPONSE_OPTIONS_WHEN_ASSIGNED_TO_GROUP = {
  // Out of the box, all response options defined in the form are available when incident is assigned to the group
};

// =====================================================================================================================
// Global variables
// =====================================================================================================================

var notePrefix = "[xMatters] - ";

var STATUS_IN_PROGRESS = "In Progress";
var STATUS_RESOLVED = "Resolved";
var STATUS_REASON = "No Further Action Required"

var REQUEST_ACTION_DELETE = "Delete";

var RESPONSE_ACTION_ACCEPT = "ACCEPT";
var RESPONSE_ACTION_RESOLVE = "RESOLVE";
var RESPONSE_ACTION_IGNORE= "IGNORE";

var RESPONSE_ACTION_ACK = "ACK";
var RESPONSE_ACTION_ACKNOWLEDGE = "ACKNOWLEDGE";

// Incident ID properties
var PROPERTY_TICKET_ID     = 'Incident_Number'; // Regular callbacks
var INT_PROPERTY_TICKET_ID = 'Incident Number'; // Integrated properties callbacks

var log = new Logger("BMC Remedy incident: ");
