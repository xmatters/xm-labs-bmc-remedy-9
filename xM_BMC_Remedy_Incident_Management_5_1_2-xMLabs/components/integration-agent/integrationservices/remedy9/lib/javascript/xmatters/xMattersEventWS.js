/******************************************************************************/
/*          Start of xMatters Webservices Event Object Definition             */
/******************************************************************************/

var xMattersEventWS = xMattersWS.extend({

  LOG_SOURCE: "xMattersEventWS.js: ",

// Status of returned if incident does not exist in xMatters
  UNKNOWN_INCIDENT: "UNKNOWN_INCIDENT",

  /**
   * Initialize the class variables
   */
  init: function()
  {
    this._super();    
  },
  
  /**
   * Query xMatters for the incident
   * @param incidentId id of the incident to retrieve
   * @return true if the incident exists, false otherwise
   */
  queryIncident: function(incidentId)
  {
    var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "QueryIncident", "QueryIncident", this.XM_SOAP_VERSION);

    // Set the parameter values
    msg.setParameter("user", this.wsUser);
    msg.setParameter("password", this.wsPassword);
    msg.setParameter("company", this.wsCompany);
    msg.setParameter("incidentIdentifier", incidentId);
  
    // Post the message to the SOAP endpoint
    var response = this.sendReceive(this.endPoint, msg);

    var status = response.xmns::QueryIncidentResponse.child(QName(xmns, "return")).xmns::status;
    this.log.debug("xMattersEventWS.js: Response Status: " + status);
    var exists = !this.UNKNOWN_INCIDENT.equalsIgnoreCase(status) && !this.SERVICE_DENIED.equalsIgnoreCase(status);

    return exists;
  }

});