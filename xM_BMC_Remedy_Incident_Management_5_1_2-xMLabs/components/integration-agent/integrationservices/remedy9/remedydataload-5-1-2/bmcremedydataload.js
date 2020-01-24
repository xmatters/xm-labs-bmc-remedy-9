// =====================================================================================================================
//
// Main file for the BMC Remedy data load integration service. Handles requests for batch and dynamic loading of
// user, group and team data from Remedy to xMatters.
//
// Remedy data is accessed via the xm-ctm-XXX.js files that wrap xMatters custom Web services in Remedy.
//
// Data sync include / exclude lists are defined in dataSync.js
//
// =====================================================================================================================
importPackage(java.util);
importPackage(java.io);
importPackage(java.text);

importClass(Packages.com.alarmpoint.integrationagent.apxml.APXMLMessage);
importClass(Packages.com.alarmpoint.integrationagent.apxml.APXMLMessageImpl);
importClass(Packages.com.alarmpoint.integrationagent.apxml.APXMLToken);
importClass(Packages.com.alarmpoint.integrationagent.security.EncryptionUtils);
importClass(Packages.com.alarmpoint.integrationagent.soap.exception.SOAPRequestException);

importClass(Packages.com.thoughtworks.xstream.converters.reflection.PureJavaReflectionProvider);

importClass(Packages.org.apache.commons.httpclient.Header);
importClass(Packages.org.apache.commons.httpclient.HttpVersion);
importClass(Packages.org.mule.providers.http.HttpResponse);

var PRODUCT_VERSION_NUMBER = "9";
var INTEGRATION_VERSION_NUMBER = "-5-1-2";

load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/lib/javascript/core/baseclass.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/lib/javascript/core/logger.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/lib/javascript/webservices/wsutil.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/lib/javascript/webservices/soapfault.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/lib/javascript/xmatters/xmattersws.js");

// Core Javascript files for data sync
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/lib/javascript/xmatters/xMattersEventWS.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/lib/javascript/xmatters/xMattersUserSync.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/lib/javascript/xmatters/xMattersGroupSync.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/lib/javascript/xmatters/dataSyncHelper.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/lib/javascript/xmatters/dataSyncDevice.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/lib/javascript/xmatters/dataSyncUser.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/lib/javascript/xmatters/dataSyncGroup.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/lib/javascript/xmatters/dataSyncGroupMember.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/lib/javascript/xmatters/dataSyncTeam.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/lib/javascript/xmatters/dataSyncCoverage.js");

// Files shared by the different Remedy integration services
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/util.js");

// Integration-specific Javascript files
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedydataload"+INTEGRATION_VERSION_NUMBER+"/configuration.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedydataload"+INTEGRATION_VERSION_NUMBER+"/dataSyncList.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedydataload"+INTEGRATION_VERSION_NUMBER+"/xm-ctm-people-ws.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedydataload"+INTEGRATION_VERSION_NUMBER+"/xm-ctm-support-group-ws.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedydataload"+INTEGRATION_VERSION_NUMBER+"/xm-ctm-supportgroupassoc-join-people-ws.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedydataload"+INTEGRATION_VERSION_NUMBER+"/xm-ctm-support-group-functional-role-ws.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedydataload"+INTEGRATION_VERSION_NUMBER+"/bmcremedydataload-lifecycle.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedydataload"+INTEGRATION_VERSION_NUMBER+"/processUsers.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedydataload"+INTEGRATION_VERSION_NUMBER+"/processGroups.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedydataload"+INTEGRATION_VERSION_NUMBER+"/phonenumber.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedydataload"+INTEGRATION_VERSION_NUMBER+"/userRolesMapper.js");
load("integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedydataload"+INTEGRATION_VERSION_NUMBER+"/supervisorMapper.js");

// REB support (for XMIO.decryptFile)
load("lib/integrationservices/javascript/event.js");

var XM_CTM_WS_PASSWORD = XMIO.decryptFile(XM_CTM_WS_PASSWORD_FILE);

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * apia_http
 *
 * This is the entry point for HTTP requests from Remedy that initiate data load operations.
 *
 * This method expects that the POST body contains a SOAP 1.1 message indicating the data load action to be taken.
 *
 * ---------------------------------------------------------------------------------------------------------------------
 */
function apia_http(httpRequestProperties, httpResponse)
{
    log.debug("Enter - apia_http");
    log.debug("httpRequestProperties: " + httpRequestProperties);

    var httpRequest = null;
    var requestBody = null;
    var responseBody = null;

    try
    {
        httpRequest = httpRequestProperties.getProperty("http.request");
        // need to remove the <? .. ?> for our xml parser
        requestBody = new XML( new WSUtil().formatStringForE4X( httpRequestProperties.getProperty("REQUEST_BODY") ) );
//      log.debug("Handling request to: " + httpRequest);

        log.info("Request body: " + requestBody);

        // -------------------------------------------------------------------------------------------------------------
        // Requests from Remedy are not processed immediately by this code but are put in a queue object and will
        // be handled asynchronously by queueConsumer function below running in another thread.
        //
        // This allows batch data load operations to run for longer than the HTTP timeout mechanism would allow.
        // -------------------------------------------------------------------------------------------------------------
        var obj = new Object();

        obj.action = requestBody.*::Body.*::TriggerRequest.*::action;
        obj.id = requestBody.*::Body.*::TriggerRequest.*::id;
        obj.requestType = requestBody.*::Body.*::TriggerRequest.*::requestType;
        obj.additionalData = requestBody.*::Body.*::TriggerRequest.*::additionalData;

        if (isEmpty(obj.action))
        {
            throw "apia_http: Invalid request - no action element found."
        }

        // Add the request to the BlockingQueue for processing by the dataload thread
        log.debug("apia_http: queuing action [" + obj.action + "], id [" + obj.id + "]");
        queue.put(obj);

        responseBody = makeSoapResponseBody(APIA_HTTP_RECEIVED, "Request was submitted for processing");
    }
    catch (e)
    {
        responseBody = makeSoapResponseBody(APIA_HTTP_ERROR, e.toString());
    }
    finally
    {
        httpResponse.setStatusLine(HttpVersion.HTTP_1_1, 200);
        httpResponse.setHeader(new Header("Content-Type", httpRequestProperties.getProperty("Content-Type")));
        httpResponse.setBodyString(responseBody);
    }

    log.debug("apia_http - response body [" + responseBody + "]");
    log.debug("Exit - apia_http");

    return httpResponse;
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * queueConsumer
 *
 * Main function consuming request objects from the asynchronous queue. Retrieves items from the request queue and
 * passes them on for processing.
 *
 * The queue object and keepThreadAlive and shouldContinue flags are defined in remedydataload-lifecycle.js
 *
 * queue.take() will block and wait until an item is added to the queue by the code above.
 *
 * ---------------------------------------------------------------------------------------------------------------------
 */
function queueConsumer()
{
    log.debug("Enter - queueConsumer");

    while (keepThreadAlive)
    {
        if (shouldContinue)
        {
            try
            {
                // Reset the success/warning/failure collections
                failedList = new ArrayList();
                successList = new ArrayList();
                warningList = new ArrayList();
                reprocessedList = new ArrayList();

                var queueItem = queue.take();
                processDataLoadRequest(queueItem);

                logSyncResults(queueItem);
            }
            catch (e)
            {
                log.debug("queueConsumer - Exception: " + e.toString());
            }
        }
    }

    log.debug("Exit - queueConsumer");
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * processDataLoadRequest
 *
 * Data loading will be carried out by the library classes in integrationservices/rod10/lib/javascript/xmatters,
 * subject to the configuration settings in dataSyncList.js
 *
 * ---------------------------------------------------------------------------------------------------------------------
 */
function processDataLoadRequest(requestObject)
{
    log.debug("Enter - processDataLoadRequest");

    log.info("processDataLoadRequest: processing request - action [" + requestObject.action + "], id [" + requestObject.id + "]");

    var isUserAction = false;
    var isGroupAction = false;
    var isUpdateOnly;

    // For add, update and delete actions the format of the id determines whether this request applies to
    // a person or a group
    if (!isEmpty(requestObject.id))
    {
        isUserAction = requestObject.id.toLowerCase().indexOf("ppl") != -1;
        isGroupAction = requestObject.id.toLowerCase().indexOf("sgp") != -1;
    }

    switch (String(requestObject.action.toLowerCase()))
    {
        case ACTION_LOAD:
            log.info("processDataLoadRequest: starting batch data load");

            processRemedyUsers(XM_CTM_PEOPLE_WS_BATCH_QUALIFICATION, DELETE_FROM_XMATTERS, ONLY_UPDATE_USER);
            processRemedySupportGroups(XM_CTM_SUPPORT_GROUP_WS_BATCH_QUALIFICATION, DELETE_FROM_XMATTERS);
            break;

        case ACTION_ADD:
        case ACTION_UPDATE:
            if (isUserAction)
            {
                // A user that doesn't match the general selection criteria should only be updated
                isUpdateOnly = !isQualifyingUser(requestObject.id);
                processRemedyUsers(XM_CTM_PEOPLE_WS_PERSON_QUALIFICATION.replace("${PERSON_ID}", String(requestObject.id)), DELETE_FROM_XMATTERS, isUpdateOnly);
            }
            else if (isGroupAction)
            {
                // A group that doesn't match the general selection criteria should only be updated
                isUpdateOnly = !isQualifyingGroup(requestObject.id);
                processRemedySupportGroups(XM_CTM_SUPPORT_GROUP_WS_GROUP_QUALIFICATION.replace("${GROUP_ID}", String(requestObject.id)), DELETE_FROM_XMATTERS, isUpdateOnly, requestObject.requestType, requestObject.additionalData);
            }
            else
            {
                throw("Request action and id could not be matched to an operation")
            }
            break;

        case ACTION_DELETE:
            if (isUserAction)
            {
                processRemedyUsers(XM_CTM_PEOPLE_WS_PERSON_QUALIFICATION.replace("${PERSON_ID}", String(requestObject.id)), PROCESS_DELETE);
            }
            else if (isGroupAction)
            {
                processRemedySupportGroups(XM_CTM_SUPPORT_GROUP_WS_GROUP_QUALIFICATION.replace("${GROUP_ID}", String(requestObject.id)), PROCESS_DELETE);
            }
            else
            {
                throw("Request action and id could not be matched to an operation")
            }
            break;


        default:
            throw("Request action and id could not be matched to an operation")
    }

    log.debug("Exit - processDataLoadRequest");
}


/**
 * ---------------------------------------------------------------------------------------------------------------------
 * logSyncResults
 *
 * Logs the results from the synchronization process.
 *
 * Also sends a QuickMessage for batch loads if this option is enabled or if there were any warnings or errors.
 * ---------------------------------------------------------------------------------------------------------------------
 */
function logSyncResults(syncRequest)
{
    log.debug("Enter - logSyncResults");

    var syncAction = syncRequest.action + (isEmpty(syncRequest.id) ? "" : ", Remedy ID: " + syncRequest.id);
    var totalCount = successList.size() + warningList.size() + failedList.size();
    var successCount = successList.size();
    var warningCount = warningList.size();
    var failCount = failedList.size();
	var notes = [];

    var msg = "Synchronization Summary\n\n";
    msg += "Action: " + syncAction + "\n";
    msg += "Total Number of Objects Processed: " + totalCount + "\n";
    msg += "Successful Count: " + successCount + "\n";
    msg += "Successful with Warnings Count: " + warningCount + "\n";
    msg += "Failure Count: " + failCount + "\n\n";

    log.warn(msg);

    if (log.isDebugEnabled())
    {
        if (successList.size() > 0)
        {
            log.debug("Synchronization Success Summary:");
			notes.push("Synchronization Success Summary:");
            for (var i = 0; i < successList.size(); i++)
            {
                notes.push(successList.get(i));
                log.debug(successList.get(i));
            }
			notes.push("");
        }
    }

    if (warningList.size() > 0)
    {
        log.warn("Synchronization Success with Warnings Summary:");
        notes.push("Synchronization Success with Warnings Summary:");
        for (var i = 0; i < warningList.size(); i++)
        {
            notes.push(warningList.get(i));
            log.warn(warningList.get(i));
        }
		notes.push("");
    }

    if (failedList.size() > 0)
    {
        log.warn("Synchronization Failure Summary:");
        notes.push("Synchronization Failure Summary:");
        for (var i = 0; i < failedList.size(); i++)
        {
            notes.push(failedList.get(i));
            log.warn(failedList.get(i));
        }
		notes.push("");
    }

    if ((SEND_SYNC_SUMMARY && (syncRequest.action == ACTION_LOAD))
        || (warningList.size() > 0)
        || (failedList.size() > 0))
    {
        sendSyncSummaryMessage(syncAction, totalCount, successCount, warningCount, failCount, notes);
    }

    log.debug("Exit - logSyncResults");
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * sendSyncSummaryMessage
 *
 * Sends a message to xMatters with a summary of the sync results
 *
 * @param msg String containing the message to send
 * ---------------------------------------------------------------------------------------------------------------------
 */
function sendSyncSummaryMessage(syncAction, totalCount, successCount, warningCount, failCount, notesArray)
{
    log.debug("Enter - sendSyncSummaryMessage");

	/*
    var apxml = ServiceAPI.createAPXML();

    apxml.setMethod("ADD");
    apxml.setSubclass("action");
    apxml.setToken("recipients", XMATTERS_ADMINISTRATOR);

    apxml.setToken("action", syncAction);

    // use toString() on the numeric count values to avoid them being formatted as floating point when they get to xMatters

    apxml.setToken("total_count", totalCount.toString());
    apxml.setToken("success_count", successCount.toString());
    apxml.setToken("warning_count", warningCount.toString());
    apxml.setToken("error_count", failCount.toString());

    apxml.setToken("has_warnings", warningCount > 0 ? "true" : "false");
    apxml.setToken("has_errors", failCount > 0 ? "true" : "false");
    apxml.setToken("company_name", XMATTERS_COMPANY_NAME);

    var notes = "For further information, please refer to the Integration Agent log file";
    apxml.setToken("notes", notes);

    try
    {
        ServiceAPI.sendAPXML(apxml);
        log.debug("Finished sending apxml to xMatters");
    }
    catch (e)
    {
        log.error("Caught exception processing [sync summary] Exception:" + e);
    }
	*/

	// Create payload
    var notes = "For further information, please refer to the Integration Agent log file";
	if (notesArray !== undefined && notesArray && notesArray.length > 0) {
		notes += "\n\n" + notesArray.join("\n");
	}
	var payload = {};
	payload.action = syncAction;
	payload.companyName = XMATTERS_COMPANY_NAME;
	payload.environment = ENVIRONMENT;
	payload.errorCount = failCount;
	payload.hasErrors = (failCount > 0);
	payload.hasWarnings = (warningCount > 0);
	payload.notes = notes;
	payload.recipients = XMATTERS_ADMINISTRATOR;
	payload.successCount = successCount;
	payload.totalCount = totalCount;
	payload.warningCount = warningCount;

    try
    {
        log.debug("About to send Sync Summary Payload to xMatters: " + JSON.stringify(payload));
		XMIO.post(JSON.stringify(payload));
        log.debug("Finished sending Sync Summary to xMatters");
    }
    catch (e)
    {
        log.error("Caught exception processing [sync summary] Exception:" + e);
    }

    log.debug("Exit - sendSyncSummaryMessage");
}



/**
 * ---------------------------------------------------------------------------------------------------------------------
 * apia_response
 *
 * This is the main method for handling APXML messages sent to the
 * Integration Service by AlarmPoint.  The messages may be responses to
 * previous submissions, or they may be requests to the Integration Service
 * that originate from AlarmPoint
 * (e.g., via an ExternalServiceMessage/ExternalServiceRequest2).
 *
 * Any APXMLMessage object that this method returns will be sent to AlarmPoint
 * either via the Integration Service's outbound queues or directly as a
 * Web Service response, depending on the mechanism used to submit the APXML.
 * ---------------------------------------------------------------------------------------------------------------------
 */
function apia_response(apxml)
{
    log.debug("Enter - apia_response");
    log.debug("apia_response - method [" + apxml.getMethod() + "], transaction ID [" + apxml.getTransactionId() + "]");

    /**
     * Only need to handle OK and Error responses from xMatters.
     */
    var method = apxml.getMethod();

    if (APXMLMessage.OK_METHOD.equalsIgnoreCase(method))
    {
        return handleOK(apxml);
    }
    else if (APXMLMessage.ERROR_METHOD.equalsIgnoreCase(method))
    {
        return handleERROR(apxml);
    }
    else if (APXMLMessage.REQUEST_METHOD.equalsIgnoreCase(method))
    {
        return handleRequest(apxml);
    }
    else if (APXMLMessage.SEND_METHOD.equalsIgnoreCase(method))
    {
        return handleSend(apxml);
    }
    else
    {
        throw new IllegalArgumentException("Unrecognized APXML method: " + method);
    }

    log.debug("Exit - apia_response");
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * handleOK
 *
 * OK responses are returned by AlarmPoint for each APXML message that it accepts
 * from an Integration Service.
 * ---------------------------------------------------------------------------------------------------------------------
 */
function handleOK(apxml)
{
    var id = apxml.getTransactionId();
    log.info("Submission of transaction " + id + " succeeded.");
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * handleERROR
 *
 * ERROR responses are returned by AlarmPoint for each APXML message that it
 * is unable to accept from an Integration Service.
 * ---------------------------------------------------------------------------------------------------------------------
 */
function handleERROR(apxml)
{
    var id = apxml.getTransactionId();
    var code = apxml.getValue(APXMLMessage.ERROR_CODE);
    log.error("Submission of transaction " + id + " failed with error code " + code);
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * Requests are forwarded to the Send handler. Messages may come from ESM or ESR to the IA.
 * ---------------------------------------------------------------------------------------------------------------------
 */
function handleRequest(apxml)
{
    log.debug("handleRequest received apxml, forwarding to handleSend");
    return handleSend(apxml);
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * The main routine for handling Requests from AlarmPoint
 *
 * The Data Load integration does not push any information about data load notifications back to Remedy so just log it.
 * ---------------------------------------------------------------------------------------------------------------------
 */
function handleSend(apxml)
{
    var id = apxml.getTransactionId();
    log.info("Response from xMatters for transaction " + id + " received.");
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * This is the main method for handling APXML messages sent to the
 * Integration Service by APClient.  The messages may be requests to perform
 * local activity, or they may be requests to make submissions to AlarmPoint.
 * <p>
 * Any APXMLMessage object that this method returns will be sent to xMatters
 * via the Integration Service's outbound queues.
 * ---------------------------------------------------------------------------------------------------------------------
 */
//function apia_input(apxml)
//{
//    // Forward APXML to xMatters.
//    return apxml;
//}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * This is a placeholder function to handle callbacks from apia requests. Called from
 * ---------------------------------------------------------------------------------------------------------------------
 */
function apia_callback(msg) {
    log.info( "In apia - callback" );
    var debugMsg = "Received message from xMatters:";
    debugMsg += "\nIncident: " + msg.incident_id;
    debugMsg += "\nEvent ID: " + msg.eventidentifier;
    debugMsg += "\nCallback type: " + msg.xmatters_callback_type;
    log.debug( debugMsg );
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * Below are features from the dataload's original util.js file, that were removed in subsequent versions of
 * incident management
 * ---------------------------------------------------------------------------------------------------------------------
 */
        var APIA_HTTP_RECEIVED = "Received";
        var APIA_HTTP_ERROR = "Error";

        /**
         * ---------------------------------------------------------------------------------------------------------------------
         * isEmpty
         *
         * Checks if the given value is null or an empty string
         *
         * @param value parameter to check
         * @return true if the value is empty, false otherwise
         * ---------------------------------------------------------------------------------------------------------------------
         */
        function isEmpty(value)
        {
            if (value == null || "".equalsIgnoreCase(value) || value == "" || typeof value == "undefined")
            {
                return true;
            }
            return false;
        }

        /**
         * ---------------------------------------------------------------------------------------------------------------------
         * equalsIgnoreCase
         *
         * Case-insensitive compare of 2 strings. If either argument is null or undefined the result is false.
         *
         * @param string1
         * @param string2
         * ---------------------------------------------------------------------------------------------------------------------
         */
        function equalsIgnoreCase(string1, string2)
        {
            log.debug("[" + typeof string1 + "], [" + typeof string2 + "]");
            if (string1 != null && typeof string1 != "undefined" && string2 != null && typeof string2 != "undefined")
            {
                return string1.toUpperCase() == string2.toUpperCase();
            }
            return false;
        }

        /**
         * ---------------------------------------------------------------------------------------------------------------------
         * getPassword
         *
         * Decrypts the password for the ServiceDeskUser used by the integration
         *
         * @param passwordFile file/path of the file containing the encrypted password
         * @return decrypted password or an empty string if the password cannot be decrypted
         * ---------------------------------------------------------------------------------------------------------------------
         */
        function getPassword(passwordFile)
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



        /**
         * Core function for handling of exceptions thrown in webservice calls.
         * @param e exception thrown
         * @param source the function the exception was thrown from
         * @param soapVersion SOAP version for retrieving the correct format of the SOAP fault
         */
        function handleError(e, source, soapVersion)
        {
            log.debug("Enter - handleError");

            // ---------------------------------------------------------------------------------------------------------
            // When the list would be empty due to the startRecord or Qualification, the Web service will actually
            // return a SOAP fault with faultstring "ERROR (302): Entry does not exist in database".
            //
            // However, this same faultstring can also be returned in other cases such as an invalid userName so it
            // isn't possible to determine the exact cause of the fault by examination. Because of this, we assume that
            // any SOAP fault received here means a legitimate empty list. If the interface changes it may be possible
            // to inspect the fault and determine the exact cause.
            // ---------------------------------------------------------------------------------------------------------


            // Start by seeing if there is any sign of XML in the response.
            var exceptionAsString = e.toString();

            var startIndex = exceptionAsString.indexOf('<');

            if (startIndex != -1)
            {
                log.debug("Constructing SOAPFault Object with " + exceptionAsString.substring(startIndex));
                var soapFault = new SOAPFault(exceptionAsString.substring(startIndex), soapVersion);

                // If the SOAPFault constructor can parse the XML, it should find a faultstring
                if (soapFault.faultstring != null)
                {
                    this.log.info(source + " - Found SOAP Fault; assume empty list ");
                }
                else
                {
                    this.log.error(source + ": caught Exception - name: [" + e.name + "], message [" + e.message + "]");
                    this.log.error(source + " - no SOAPFault in exception; re-throwing.");
                    throw(e);
                }
            }
            else
            {
                this.log.error(source + ": caught Exception - name: [" + e.name + "], message [" + e.message + "]");
                this.log.error(source + " - no SOAPFault in exception; re-throwing.");
                throw(e);
            }

            log.debug("Exit - handleError");
        }

        /**
         * ---------------------------------------------------------------------------------------------------------------------
         * makeSoapResponseBody
         *
         * @param status
         * @param description
         * ---------------------------------------------------------------------------------------------------------------------
         */
        function makeSoapResponseBody(status, description)
        {
            log.debug("Enter - makeSoapResponseBody");

            var soapResponse = new XML();
            soapResponse = <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:apia="http://www.xmatters.com/apia_http_bmcremedy/">
                <soapenv:Header/>
                <soapenv:Body>
                    <apia:TriggerResponse>
                        <apia:status/>
                        <apia:description/>
                    </apia:TriggerResponse>
                </soapenv:Body>
            </soapenv:Envelope>;

            soapResponse.*::Body.*::TriggerResponse.*::status = status;
            soapResponse.*::Body.*::TriggerResponse.*::description = description;

            log.debug("httpResponse [" + soapResponse + "]");
            log.debug("Exit - makeSoapResponseBody");

            return soapResponse;
        }
