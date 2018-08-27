/******************************************************************************/
/*                Start of Data Sync Team Object Definition                   */
/******************************************************************************/
var Team = xMattersWS.extend({

  LOG_SOURCE: "dataSyncTeam.js: ",
  UNKNOWN_TEAM: "UNKNOWN_TEAM",

  /**
   * Initialize the class variables
   */
  init: function()
  {
    this._super(); 
    this.groupName = "";
    this.teamName = "";
    this.teamDescription = "";
    this.externallyOwned = false;
    this.reuse = true;
    this.name = "";
    this.type = "BASIC";
    this.rotationInterval = "";
    this.rotationStart = "";
    this.rotationUnit ="";
    this.teamExists = null;

    this.members = new LinkedHashMap();
  },

  /**
   * Process the members for the team and create the corresponding members list
   * @param useNs true if the output XML should be prefixed with the namespace, false otherwise
   * @return String containing XML for the members in the webservice call
   */
  getMembers: function(useNs)
  {
    var memberXml = "";
    var keys = this.members.keySet().toArray();
    for (var i=0; i<this.members.size(); i++)
    {
      if (useNs)
      {
        memberXml += "<sch:member>";
        memberXml += "<sch:delay>" + StringEscapeUtils.escapeXml(this.members.get(keys[i]).delay) + "</sch:delay>";
        memberXml += "<sch:inRotation>" + StringEscapeUtils.escapeXml(this.members.get(keys[i]).inRotation) + "</sch:inRotation>";
        memberXml += "<sch:targetName>" + StringEscapeUtils.escapeXml(this.members.get(keys[i]).targetName) + "</sch:targetName>";
        memberXml += "<sch:type>" + StringEscapeUtils.escapeXml(this.members.get(keys[i]).type) + "</sch:type>";
        memberXml += "</sch:member>";
      }
      else
      {
        memberXml += "<member xsi:type=\"m:SoapTeamMember\">";
        memberXml += "<delay xsi:type=\"xsd:string\">" + StringEscapeUtils.escapeXml(this.members.get(keys[i]).delay) + "</delay>";
        memberXml += "<inRotation xsi:type=\"xsd:string\">" + StringEscapeUtils.escapeXml(this.members.get(keys[i]).inRotation) + "</inRotation>";
        memberXml += "<targetName xsi:type=\"xsd:string\">" + StringEscapeUtils.escapeXml(this.members.get(keys[i]).targetName) + "</targetName>";
        memberXml += "<type xsi:type=\"xsd:string\">" + StringEscapeUtils.escapeXml(this.members.get(keys[i]).type) + "</type>";
        memberXml += "</member>";
      }
    }
    return memberXml;
  },

  /**
   * Add the team to xMatters
   * @return response body from the SOAP Response
   */
  add: function()
  {
    var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "AddTeam", "AddTeam", this.XM_SOAP_VERSION);
    this.initializeAddOrUpdate(msg, true);
    
    return this.syncSendReceive(this.endPoint, msg, "Add Team", this.name).xmns::AddTeamResponse.child(QName(xmns, "return")).xmns::status;
  },

  /**
   * Update the team in xMatters
   * @return response body from the SOAP Response
   */
  update: function()
  {
    if (this.exists())
    {
      var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "UpdateTeam", "UpdateTeam", this.XM_SOAP_VERSION);
      this.initializeAddOrUpdate(msg, true);
      
      msg.setParameter("groupName", this.groupName);

      return this.syncSendReceive(this.endPoint, msg, "Update Team", this.name).xmns::UpdateTeamResponse.child(QName(xmns, "return")).xmns::status;
    }
    throw this.UNKNOWN_TEAM;
  },
  
  /**
   * Delete the team from xMatters
   * @return response body from the SOAP Response
   */
  remove: function()
  {
    if (this.exists())
    {
      var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "DeleteTeam", "DeleteTeam", this.XM_SOAP_VERSION);
      msg.setParameter("user", this.wsUser);
      msg.setParameter("password", this.wsPassword);
      msg.setParameter("company", this.wsCompany);
      msg.setParameter("groupName", this.groupName);

      return this.syncSendReceive(this.endPoint, msg, "Delete Team", this.name).xmns::DeleteTeamResponse.child(QName(xmns, "return")).xmns::status;
    }
    throw this.UNKNOWN_TEAM;
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
    this.teamDescription = !"".equalsIgnoreCase(this.teamDescription) ? this.teamDescription : this.groupName + " - " + this.DEFAULT_TEAM_NAME;
    msg.setParameter("teamDescription", this.teamDescription);
    msg.setParameter("externallyOwned", this.externallyOwned);
    msg.setParameter("reuse", this.reuse);
    this.name = !"".equalsIgnoreCase(this.name) ? this.name : this.groupName + " - " + this.DEFAULT_TEAM_NAME;
    msg.setParameter("name", this.name); 
    msg.setParameter("rotationInterval", this.rotationInterval);
    msg.setParameter("rotationStart", this.rotationStart);
    msg.setParameter("rotationUnit", this.rotationUnit);
    msg.setParameter("type", this.type);
    msg.setParameter("members", this.getMembers(useNs), false);
  },

  /**
   * Checks if the team exists in xMatters.
   */
  exists: function()
  {
    if (this.teamExists == null)
    {
      this.query();
    }
    return this.teamExists;
  },
  
  /**
   * Queries for the team in xMatters.
   */
  query: function()
  {
    this.teamExists = false;
    
    var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "QueryGroup", "QueryGroup", this.XM_SOAP_VERSION);
    msg.setParameter("user", this.wsUser);
    msg.setParameter("password", this.wsPassword);
    msg.setParameter("company", this.wsCompany);
    msg.setParameter("groupName", this.groupName);

    var response = this.sendReceive(this.endPoint, msg);
    
    var teamName = !"".equalsIgnoreCase(this.teamName) ? this.teamName : this.groupName + " - " + this.DEFAULT_TEAM_NAME;
    var group = response.xmns::QueryGroupResponse.child(QName(xmns, "return")).xmns::group;

    default xml namespace = xmns;

    var team = group.teams.team.(name == teamName);

    if (team.length() > 0)
    {
      // As we have team members, store them in the member variable
      this.rotationInterval = team.rotationInterval;
      this.rotationStart = team.rotationStart;
      this.rotationUnit = team.rotationUnit;
      this.type = team.type;
      this.setTeamMembers(team);
      this.teamExists = true;
    }
    return team;
  },
  
  /**
   * Store the members of the team in the members map. Note - this will preserve the
   * data from xMatters for those users that exist in the group in the management system.
   * If the user exists in the team in xMatters, but does NOT exist in the team in the
   * management system, it will be removed from the team in xMatters
   * @param team XML node containing the team members
   */
  setTeamMembers: function(team)
  {
    var dataSyncHelper = new DataSyncHelper(syncList, "users");
    var orderedMembers = new LinkedHashMap();

    var xMMembers = team.members.member;

    // Check the team members to see if they exist within xMatters
    // We want to keep the existing members delay periods.
    for each (member in xMMembers) 
    { 
      var memberName = member.name.toString();

      // Check if the member exists in Management System
      if (this.members.containsKey(memberName)) 
      {
        // Only process the member if they are not being excluded from sync
        var grpMember = this.members.get(memberName);

        // Update the member with the xMatters info
        grpMember.delay = member.delay.toString();
        grpMember.inRotation = member.inRotation.toString();

        // Add the member to the list of ordered members and remove it from the existing list
        orderedMembers.put(memberName, grpMember);
        this.members.remove(memberName);
      }
    }

    // After processing all the users that existed in both the managemenet system 
    // and xMatters we want to include any new management system members
    orderedMembers.putAll(this.members);
    this.members.clear();
    this.members = orderedMembers;
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
    return "<Team>" + 
           "<groupName>" + this.groupName + "</groupName>" +
           "<teamName>" + this.teamName + "</teamName>" +
           "<teamDescription>" + this.teamDescription + "</teamDescription>" +
           "<externallyOwned>" + this.externallyOwned + "</externallyOwned>" +
           "<reuse>" + this.reuse + "</reuse>" +
           "<name>" + this.name + "</name>" +
           "<type>" + this.type + "</type>" +
           "</Team>";
  }
  
});
