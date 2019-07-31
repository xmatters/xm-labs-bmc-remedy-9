importPackage(java.util);
importPackage(java.io);
importPackage(java.text);

importClass(Packages.com.alarmpoint.integrationagent.apxml.APXMLMessage);
importClass(Packages.com.alarmpoint.integrationagent.apxml.APXMLMessageImpl);
importClass(Packages.com.alarmpoint.integrationagent.apxml.APXMLToken);
importClass(Packages.com.alarmpoint.integrationagent.soap.exception.SOAPRequestException);

importClass(Packages.com.thoughtworks.xstream.XStream);
importClass(Packages.com.thoughtworks.xstream.converters.reflection.PureJavaReflectionProvider);

importClass(Packages.org.apache.commons.httpclient.Header);
importClass(Packages.org.apache.commons.httpclient.HttpVersion);
importClass(Packages.org.mule.providers.http.HttpResponse);

var PRODUCT_VERSION_NUMBER = "9";
var INTEGRATION_VERSION_NUMBER = "-5-1-2";

// Core Javascript files provided by the IA
load("integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/lib/javascript/core/baseclass.js");
load("integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/lib/javascript/core/logger.js");
load("integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/lib/javascript/core/util.js");
load("integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/lib/javascript/webservices/wsutil.js");
load("integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/lib/javascript/webservices/soapfault.js");
load("integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/lib/javascript/xmatters/xmattersws.js");

// REB support
load("lib/integrationservices/javascript/event.js");
// xM REST API
load("integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/remedyincident" + INTEGRATION_VERSION_NUMBER + "/xmrestapi.js");

// Integration-specific Javascript files
load("integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/util.js");
load("integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/remedyincident" + INTEGRATION_VERSION_NUMBER + "/configuration.js");
load("integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/remedyincident" + INTEGRATION_VERSION_NUMBER + "/xm-hpd-helpdesk-ws.js")
load("integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/remedyincident" + INTEGRATION_VERSION_NUMBER + "/xm-hpd-incident-interface-ws.js");
load("integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/remedyincident" + INTEGRATION_VERSION_NUMBER + "/xm-sup-grp-assoc-ws.js")
load("integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/remedyincident" + INTEGRATION_VERSION_NUMBER + "/updateIncident.js");
load("integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/remedyincident" + INTEGRATION_VERSION_NUMBER + "/http_event.js");

var INITIATOR_PASSWORD = XMIO.decryptFile(INITIATOR_PASSWORD_FILE);
var REMEDY_WS_PASSWORD = XMIO.decryptFile(REMEDY_WS_PASSWORD_FILE);

load("integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/remedyincident" + INTEGRATION_VERSION_NUMBER + "/bmcremedyincident-event.js");
load("integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/remedyincident" + INTEGRATION_VERSION_NUMBER + "/bmcremedyincident-callbacks.js");
load("integrationservices/remedy" + PRODUCT_VERSION_NUMBER + "/remedyincident" + INTEGRATION_VERSION_NUMBER + "/bmcremedyincident-properties.js");
