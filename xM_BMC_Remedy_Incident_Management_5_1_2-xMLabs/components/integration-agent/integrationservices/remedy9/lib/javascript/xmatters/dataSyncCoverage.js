/******************************************************************************/
/*                Start of Data Sync Coverage Object Definition               */
/******************************************************************************/
var Coverage = xMattersWS.extend({

  LOG_SOURCE: "dataSyncCoverage.js: ",
  UNKNOWN_COVERAGE: "UNKNOWN_COVERAGE",

  /**
   * Initialize the class variables
   */
  init: function()
  {
    this._super(); 
    this.groupName = "";
    this.name = "";
    this.teamName = "";

    this.monday = true;
    this.tuesday = true;
    this.wednesday = true;
    this.thursday = true;
    this.friday = true;
    this.saturday = true;
    this.sunday = true;

    this.durationHours = "24";
    this.durationMinutes = "0";
    this.excludeHolidays = true;
    this.includeHolidays = false;

    this.frequency = "WEEKLY";
    this.interval = "1";
    this.noEndDate = true;

    this.startDate = "10/01/2010";
    this.startTime = "00:00";
  },

  /**
   * Add the team to xMatters
   * @return response body from the SOAP Response
   */
  add: function()
  {
    var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "AddCoverage", "AddCoverage", this.XM_SOAP_VERSION);
    this.initializeAddOrUpdate(msg, true);
    
    return this.syncSendReceive(this.endPoint, msg, "Add Coverage", this.teamName).xmns::AddCoverageResponse.child(QName(xmns, "return")).xmns::status;
  },
  
  /**
   * Private helper function to initialize the values in the SOAP Message for the Group Object
   * @param msg instance of SOAPMessage to populate
   * @param useNs true if the output XML should be prefixed with the namespace, false otherwise
   */
  initializeAddOrUpdate: function(msg, useNs)
  {
    msg.setParameter("user", this.wsUser);
    msg.setParameter("password", this.wsPassword);
    msg.setParameter("company", this.wsCompany);
    msg.setParameter("groupName", this.groupName);
    this.teamName = !"".equalsIgnoreCase(this.teamName) ? this.teamName : this.groupName + " - " + this.DEFAULT_TEAM_NAME;
    msg.setParameter("teamName", this.teamName);
    this.name = !"".equalsIgnoreCase(this.name) ? this.name : this.groupName + " - " + this.DEFAULT_COVERAGE_NAME;
    msg.setParameter("name", this.name);
    msg.setParameter("monday", this.monday);
    msg.setParameter("tuesday", this.tuesday);
    msg.setParameter("wednesday", this.wednesday);
    msg.setParameter("thursday", this.thursday);
    msg.setParameter("friday", this.friday);
    msg.setParameter("saturday", this.saturday);
    msg.setParameter("sunday", this.sunday);
    msg.setParameter("durationHours", this.durationHours);
    msg.setParameter("durationMinutes", this.durationMinutes);
    msg.setParameter("excludeHolidays", this.excludeHolidays);
    msg.setParameter("includeHolidays", this.includeHolidays);
    msg.setParameter("frequency", this.frequency);
    msg.setParameter("interval", this.interval);
    msg.setParameter("noEndDate", this.noEndDate);
    msg.setParameter("startDate", this.startDate);
    msg.setParameter("startTime", this.startTime);
  },

  /**
   * Checks that the minimum team information has been provided
   */
  isValid: function()
  {
    return !"".equalsIgnoreCase(this.name);
  },
  
  /**
   * Returns a XML String representation of the Object
   * @return XML formatted String
   */
  toString: function()
  {
    return "<Coverage>" + 
           "<groupName>" + this.groupName + "</groupName>" +
           "<name>" + this.name + "</name>" +
           "<teamName>" + this.teamName + "</teamName>" +
           "<monday>" + this.monday + "</monday>" +
           "<tuesday>" + this.tuesday + "</tuesday>" +
           "<wednesday>" + this.wednesday + "</wednesday>" +
           "<thursday>" + this.thursday + "</thursday>" +
           "<friday>" + this.friday + "</friday>" +
           "<saturday>" + this.saturday + "</saturday>" +
           "<sunday>" + this.sunday + "</sunday>" +
           "<durationHours>" + this.durationHours + "</durationHours>" +
           "<durationMinutes>" + this.durationMinutes + "</durationMinutes>" +
           "<excludeHolidays>" + this.excludeHolidays + "</excludeHolidays>" +
           "<includeHolidays>" + this.includeHolidays + "</includeHolidays>" +
           "<frequency>" + this.frequency + "</frequency>" +
           "<interval>" + this.interval + "</interval>" +
           "<noEndDate>" + this.noEndDate + "</noEndDate>" +
           "<startDate>" + this.startDate + "</startDate>" +
           "<startTime>" + this.startTime + "</startTime>" +
           "</Coverage>";
  }
});