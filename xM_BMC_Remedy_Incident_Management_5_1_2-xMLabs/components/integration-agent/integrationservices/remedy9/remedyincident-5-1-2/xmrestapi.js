XMRESTAPI = {};

(function() {

  XMRESTAPI.RESPONSE_SUCCESS = "200";
  XMRESTAPI.RESPONSE_SUCCESS_ACCEPTED = "202";
  XMRESTAPI.RESPONSE_DATA_VALIDATION_ERROR = "400";

  // private functions

  function getEventFilterAsString(filter) {
    var text = "";

    for (var key in filter) {
      var value = filter[key];

      if (key == "properties") {
        var properties = "";

        var propertiesArray = []
        var valueArray = [];

        for (var p in value) {
          propertiesArray.push(encodeURIComponent(p));
          valueArray.push(encodeURIComponent(String(value[p])));
        }

      } else {
        value = String(value);
      }

      if (value != null) {
        if (text != "") text += "&";
        if (key != "properties") {
          text += key + "=" + value;
        }
      }
    }

    text += "propertyName=" + propertiesArray.toString() + "&propertyValue=" + valueArray.toString();

    IALOG.info("Returning getEventFilterAsString(): " + text)
    return text;
  }

  // public functions

  XMRESTAPI.getEvents = function(eventFilter) {

    IALOG.debug("XM REST API: getEvents for " + eventFilter);

    var parameters = getEventFilterAsString(eventFilter);
    IALOG.debug("Parameters " + parameters);
    var url = BASE_URL + XM_API_URL + "events?" + parameters;

    IALOG.info('URL Check getEvents ' + url);

    var response = XMIO.get(url, INITIATOR, INITIATOR_PASSWORD);
    IALOG.debug("XM REST API: getEvents received " + response.status + " " + response.body);

    XMRESTAPI.checkResponse(response);

    return JSON.parse(response.body);
  };

  XMRESTAPI.setEventStatus = function(eventFilter, status) {

    IALOG.debug("XM REST API: setEventStatus for " + eventFilter + " to " + status);

    var count = 0;

    var events = XMRESTAPI.getEvents(eventFilter);

    for (var i = 0; i < events.total; i++) {
      var event = events.data[i];
      IALOG.debug("\tXM REST API: setEventStatus for event href " + event.eventId + " to " + status);


      var url = BASE_URL + XM_API_URL + "events";
      IALOG.info('URL Check setEventStatus ' + url);

      var response = XMIO.post(JSON.stringify({
        "id": event.eventId,
        'status': status
      }), url, INITIATOR, INITIATOR_PASSWORD);
      IALOG.debug("XM REST API: setEventStatus received " + response.status + " " + response.body);

      XMRESTAPI.checkResponse(response, {
        status: 409
      }); // ignore conflict errors

      count++;
    }

    IALOG.info("XM REST API: setEventStatus events " + status + ": " + count);
    return count;
  };

  XMRESTAPI.deleteEvents = function(eventFilter) {
    // JSON.stringify chokes on Java strings, so we need to convert the eventFilter to a JS string if it isn't a JSON object or a JS string
    //var evFilt = (typeof(eventFilter)=="object"? eventFilter: ""+eventFilter  );
    IALOG.debug("XM REST API: deleteEvents for " + eventFilter);
    return XMRESTAPI.setEventStatus(eventFilter, "TERMINATED");
  };

  // Submit Apxml
  XMRESTAPI.submitApxml = function(url, apxml, existingEventsFilter, newKeys, deduplicationFilter) {
    var deduplicationFilterName = DEDUPLICATION_FILTER_NAME;

    if (deduplicationFilter !== undefined) {
      deduplicationFilterName = deduplicationFilter;
    }
    IALOG.debug("XM REST API: Deduplication settings: parameter passed=" + deduplicationFilter + ", value used=" + deduplicationFilterName);

    if (XMUtil.deduplicator.isDuplicate(apxml)) {
      // Discard message, adding a warning note to the log
      XMUtil.deduplicate(event.properties);
      return;
    }

    if (existingEventsFilter != null) {
      XMRESTAPI.deleteEvents(existingEventsFilter);
    }


    var eventObj = XMUtil.createEventTemplate();
    var apxmlAsObj = APXML.toEventJs(apxml, eventObj, newKeys);
    var obj = apia_event(apxmlAsObj);
    var json = JSON.stringify(obj);

    if (IALOG.isDebugEnabled()) {
      IALOG.debug("XM REST API: Post to " + url + " " + json);
    }
    var response = XMIO.post(json, url, INITIATOR, INITIATOR_PASSWORD);
    XMUtil.deduplicator.incrementCount(apxml);
    return response;
  };

  // Utility methods
  XMRESTAPI.checkResponse = function(response, ignoreError) {

    if (response.status !== undefined && response.status != XMRESTAPI.RESPONSE_SUCCESS && response.status != XMRESTAPI.RESPONSE_SUCCESS_ACCEPTED) {
      // Ignore status?
      if (ignoreError && ignoreError['status'] != null && ignoreError['status'] == response.status) {
        IALOG.debug("XM REST API: checkResponse status " + response.status + " will be treated as success");
        return response;
      }
      var error;
      try {
        var body = JSON.parse(response.body);

        if (ignoreError && ignoreError['type'] != null && ignoreError['type'] == body.type) {
          IALOG.debug("XM REST API: checkResponse error type " + response.status + " will be treated as success");
          return response;
        }
        error = body.message;
      } catch (e) {
        error = "xMatters server returned status " + response.status;
      }
      throw error;
    }

    return response;
  };

  XMRESTAPI.getFormURL = function(webServiceURL, form) {

    if (form.startsWith("http"))
      return form;

    var triggers = webServiceURL.indexOf("/triggers");
    if (triggers >= 0) {

      return webServiceURL.substring(0, webServiceURL.lastIndexOf('/', triggers - 1)) + "/" + form + "/triggers";
    }

    IALOG.warn("XM REST API:: Unrecognized WEB_SERVICE_URL format. getFormURL will use " + webServiceURL + " 'as is'.");

    return webServiceURL;
  };
})();
