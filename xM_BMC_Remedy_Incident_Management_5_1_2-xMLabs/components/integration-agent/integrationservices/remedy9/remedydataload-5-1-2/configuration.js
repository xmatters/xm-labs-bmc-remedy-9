// =====================================================================================================================
// Main Configuration settings for BMC Remedy Data Load
// =====================================================================================================================

// ----------------------------------------------------------------------------------------------------
// Identifies the Remedy source environment
// ----------------------------------------------------------------------------------------------------
var ENVIRONMENT = "DEV";

// ----------------------------------------------------------------------------------------------------
// This value determines the form that will be used to inject data load results into xMatters
// ----------------------------------------------------------------------------------------------------
var WEB_SERVICE_URL = "https://<URL>";
//----------------------------------------------------------------------------------------------------
// The Web Login ID used to authenticate the request to xMatters. The user's password should be encrypted
// using the iapassword.sh utility. Please see the integration agent documentation for instructions.
//----------------------------------------------------------------------------------------------------
var INITIATOR = "xm_remedydataload";
var INITIATOR_PASSWORD_FILE = "conf/xmremedydataload.pwd";

//----------------------------------------------------------------------------------------------------
// The User ID of the user used to authenticate the request to xMatters. Default value is "Remedy"
//----------------------------------------------------------------------------------------------------
var INITIATOR_USER_ID = INITIATOR;

// ---------------------------------------------------------------------------------------------------------------------
// Web Service credentials
//
// Credentials for accessing the XM_CTM_xxx Web service will be either provided in this file
// OR be stored in a separate password file created using iapassword.bat
// ---------------------------------------------------------------------------------------------------------------------
var XM_CTM_WS_USERNAME = "xmatters";
var XM_CTM_WS_PASSWORD_FILE = "conf/xm_ctm_ws.pwd";

// ---------------------------------------------------------------------------------------------------------------------
// Configuration variables for xMatters custom Web services in Remedy
// ---------------------------------------------------------------------------------------------------------------------
var PROTOCOL = "http";
var MID_TIER_HOSTNAME = "localhost";
var MID_TIER_PORT = "8080";
var REMEDY_SERVER_NAME = "ARServer";

var XMATTERS_COMPANY_NAME = "Default Company";

var XM_CTM_PEOPLE_WS_URL = PROTOCOL + "://" + MID_TIER_HOSTNAME + ":" + MID_TIER_PORT + "/arsys/services/ARService?server=" + REMEDY_SERVER_NAME + "&webService=XM_CTM_People_WS";
var XM_CTM_SUPPORT_GROUP_WS_URL = PROTOCOL + "://" + MID_TIER_HOSTNAME + ":" + MID_TIER_PORT + "/arsys/services/ARService?server=" + REMEDY_SERVER_NAME + "&webService=XM_CTM_Support_Group_WS";
var XM_CTM_SUPPORT_GROUP_ASSOC_WS_URL = PROTOCOL + "://" + MID_TIER_HOSTNAME + ":" + MID_TIER_PORT + "/arsys/services/ARService?server=" + REMEDY_SERVER_NAME + "&webService=XM_CTM_SupportGroupAssoc_join_People_WS";
var XM_CTM_SUPPORT_GROUP_FUNCTIONAL_ROLE_WS_URL = PROTOCOL + "://" + MID_TIER_HOSTNAME + ":" + MID_TIER_PORT + "/arsys/services/ARService?server=" + REMEDY_SERVER_NAME + "&webService=XM_CTM_SupportGroupFunctionalRole_WS";

// The "Host" header value which will be sent for the HTTP WS POST to the Remedy Midtier Server
var HOST_HEADER = MID_TIER_HOSTNAME;

// ---------------------------------------------------------------------------------------------------------------------
// Maximum number of User, Group, etc records to be retrieved from Remedy in a single Web service request.
// ---------------------------------------------------------------------------------------------------------------------
var XM_CTM_WS_CHUNK_SIZE = 250;

// ---------------------------------------------------------------------------------------------------------------------
// Qualifications / query parameters passed to the XM_CTM Web services for batch or dynamic updates
// ---------------------------------------------------------------------------------------------------------------------
var XM_CTM_PEOPLE_WS_BATCH_QUALIFICATION = "'Support Staff' = \"Yes\" AND 'Assignment Availability'=\"Yes\" AND 'Notification Availability'=\"Yes\"";
var XM_CTM_PEOPLE_WS_PERSON_QUALIFICATION = "'Person ID' = \"${PERSON_ID}\"";

var XM_CTM_SUPPORT_GROUP_WS_BATCH_QUALIFICATION = "'Vendor Group'=\"No\" AND 'On Call Group Flag'=\"Yes\" AND 'Status' = \"Enabled\"";
var XM_CTM_SUPPORT_GROUP_WS_GROUP_QUALIFICATION = "\'Support Group ID\' = \"${GROUP_ID}\"";

var XM_CTM_SUPPORT_GROUP_ASSOC_WS_QUALIFICATION = "\'Support Group ID\' = \"${GROUP_ID}\" AND \'Status\' = \"Enabled\" AND \'Assignment Availability\' = \"Yes\"";

var XM_CTM_SUPPORT_GROUP_FUNCTIONAL_ROLE_WS_QUALIFICATION = "\'Login ID\' = \"${LOGIN_ID}\" AND \'Status\' = \"Enabled\" AND \'Assignment Availability\' = \"Yes\"";

// =====================================================================================================================
// Configuration variables that control xMatters user properties
// =====================================================================================================================

// Determines the site that newly created users will belong to
var DEFAULT_USER_SITE = "Default Site";

// Determines the language of the newly created users
var DEFAULT_LANGUAGE = "English";

// Determines if the newly created users will have mobile access
var DEFAULT_MOBILE_ACCESS = false;

// Determines the time zone of the newly created users
var DEFAULT_TIME_ZONE = "US/Pacific";

// Constants used to set the isExternallyOwned properties of all xMatters users or groups
var EXTERNALLY_OWN_USERS = false;
var EXTERNALLY_OWN_GROUPS = false;

// The Web Login Type must be one of "NATIVE" or "LDAP". If set to "LDAP", then the LDAP domain must be valid
var WEB_LOGIN_TYPE = "NATIVE";
var WEB_LOGIN_LDAP_DOMAIN = "company.com";

// Default supervisor for users and groups. This will be companyadmin unless you have merged xMatters admin accounts,
// in which case it needs to be superadmin
var DEFAULT_SUPERVISOR = ["companyadmin"];

// If MAP_REMEDY_USER_ROLES is false, any newly created xMatters user is assigned the role(s) defined in DEFAULT_XMATTERS_ROLES,
// and the user roles are subsequently not changed if the user is updated. Multiple roles should be provided as a comma-
// separated list e.g. ["role1", "role2"]
//
// If MAP_REMEDY_USER_ROLES is true, xMatters roles are assigned to users based on their Remedy roles and the roleMap
// defined later in this file. In this case the user roles are set when the user is created, AND whenever they are updated.
var MAP_REMEDY_USER_ROLES = false;
var DEFAULT_XMATTERS_ROLES = ["Standard User"];

// =====================================================================================================================
// Configuration variables that control xMatters device properties
// =====================================================================================================================
var DEVICE_NAME_EMAIL = "Work Email";
var DEVICE_NAME_PHONE_NUMBER_BUSINESS = "Work Phone";
var DEVICE_NAME_PHONE_NUMBER_MOBILE = "Mobile Phone";
var DEVICE_NAME_PHONE_NUMBER_HOME = "Home Phone";
var DEVICE_NAME_PHONE_NUMBER_FAX = "Other Phone";
var PROVIDER_NAME_EMAIL = "SMTP Email";
var PROVIDER_NAME_VOICE = "Phone Engine";

// ---------------------------------------------------------------------------------------------------------------------
// Configuration variables for the data load summary notifications
// ---------------------------------------------------------------------------------------------------------------------

// Determines whether the data sync summary should be send to the xMatters Administrator
var SEND_SYNC_SUMMARY = true;

// The default user that quick message notifications will target for data sync reporting
var XMATTERS_ADMINISTRATOR = "companyadmin";


// ---------------------------------------------------------------------------------------------------------------------
// Data for mapping values from Remedy to xMatters
// ---------------------------------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------------------------------
// Mappings between Remedy functional roles and xMatters roles. Each roleMapping must have one Remedy role and can have
// one or more xMatters roles.
//
// The mapping should be defined using the Functional Role from remedy as the KEY to the roleMap entry and an Array of
// associated xMatters roles as the value (one or more). The format should be as follows:
//
// roleMap["Functional Role"] = ["xMatters Role1", "xMatters Role2", "xMatters Role3"];
//
// This data is not used unless MAP_REMEDY_USER_ROLES above is true.
// ---------------------------------------------------------------------------------------------------------------------
var roleMap = [];
roleMap["Broadcast Submitter"] = ["Subscription Supervisor"];
roleMap["Support Group Admin"] = ["Group Supervisor"];
roleMap["Support Group Manager"] = ["Group Supervisor", "Person Supervisor"];
roleMap["Support Group Lead"] = ["Person Supervisor"];

// ---------------------------------------------------------------------------------------------------------------------
// Mappings between the international dialing prefix for a country and the ISO 3166-1 alpha-2 2-character country code.
// The ISO 3166-1 codes are needed when telephone devices are added to xMatters.
//
// If more than one country entry has the same dialing prefix (e.g. the US and Canada) the first match in the list
// will be used.
//
// For more ISO 3166-1 alpha-2 codes see http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
// ---------------------------------------------------------------------------------------------------------------------
var countryCodes =
    <countryCodes>
        <country>
            <dialingPrefix>1</dialingPrefix>
            <ISO_3166_1>US</ISO_3166_1>
        </country>
        <country>
            <dialingPrefix>1</dialingPrefix>
            <ISO_3166_1>CA</ISO_3166_1>
        </country>
    </countryCodes>;

// =====================================================================================================================
// Global variables and other constants
// =====================================================================================================================

/**
 * A global logger for any js files that aren't class definitions using WSUtil as a super-class
 */
var log = new Logger("BMC Remedy data load: ");

var ACTION_LOAD = "load";
var ACTION_ADD = "add";
var ACTION_UPDATE = "update";
var ACTION_DELETE = "delete";

var REQUEST_DELETE_GROUP = "deleteGroupMember";

var PROCESS_DELETE = true;

// DELETE_FROM_XMATTERS: Set this to true if the users/groups should be removed from xMatters.
var DELETE_FROM_XMATTERS = false;

// ONLY_UPDATE_USER: Set this to true if no new users should be created in xMatters.
var ONLY_UPDATE_USER = false;

// Controls how removing a user from a BMC Remedy group will affect users in
// xMatters. If false, removing a user from a group in BMC Remedy will remove
// the User only from the default Team in the corresponding xMatters Group. If
// set to true, the User is removed from all Teams in the xMatters Group.
var REMOVE_USERS_FROM_ALL_TEAMS_IN_GROUP = false;
