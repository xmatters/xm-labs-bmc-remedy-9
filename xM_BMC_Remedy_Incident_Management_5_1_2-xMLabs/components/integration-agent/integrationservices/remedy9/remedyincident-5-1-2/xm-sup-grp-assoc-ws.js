/******************************************************************************/
/*            Start of Remedy XM CTM People Support Group Associated          */
/*                    Function Role Lookup Object Definition                  */
/******************************************************************************/
var XMSupGrpAssoc = BaseClass.extend({

    LOG_SOURCE: "xm-sup-grp-assoc-ws.js: ",
    XM_SUPP_GRP_ASSOC_SOAP_VERSION: "1_1",
    // soapUI project file that contains definitions of Web service requests
    XM_SUPP_GRP_ASSOC_WSDL_DEFN: "integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedyincident"+INTEGRATION_VERSION_NUMBER+"/soap/XM-SupportGrp-SupportGrpAssoci-WS-soapui-project.xml",
  
  /**
   * Initialize the class variables
   * @param wsutil instance of the WSUtil class for making the webservice calls
   * @param endpoint URL of the webservice endpoint
   */
  init: function(wsutil, endpoint)
  {
    this.log = new Logger(this.LOG_SOURCE);
    this.wsutil = wsutil;
    this.endpoint = endpoint;
    this.headers = new HashMap();
    this.headers.put("Host", HOST_HEADER);
  },

  /**
   * Retrieves the people matching the qualification criteria
   * @param username name of the user making the request
   * @param password string repesenting the user password
   * @param qualification criteria used to filter the request
   * @param startRecord index of first record to return
   * @param maxLimit max number of records to retrieve
   * @return list of incidents matching the qualification criteria
   */
  getGroupMemberInfoList: function(username, password, qualification, startRecord, maxLimit)
  {
    this.log.debug("Enter - groupMemberInfoList");
    
    var groupMemberInfoList = [];
    // Get the parameterized SOAP message for this request from the soapUI project file
    var msg = new SOAPMessage(this.XM_SUPP_GRP_ASSOC_WSDL_DEFN, "GroupMemberInfoList", "GroupMemberInfoList", this.XM_SUPP_GRP_ASSOC_SOAP_VERSION);
     
    // Set the actual parameter values in the request
    msg.setParameter("userName", username);
    msg.setParameter("password", password);
      
    msg.setParameter("Qualification", qualification);
    msg.setParameter("startRecord", startRecord);
    msg.setParameter("maxLimit", maxLimit);

    this.log.debug("GroupMemberInfoList: Qualification [" + qualification + "], startRecord [" + startRecord + "], maxLimit [" + maxLimit + "]");
      
    var response = this.wsutil.sendReceive(this.endpoint, msg, this.headers);
      
    for each (item in response.*::GroupMemberInfoListResponse.*::getListValues) 
    {
      var member = this.wsutil.unmarshall(item, newRemedyObject());
      groupMemberInfoList.push(member);
    }

    this.log.debug("Exit - groupMemberInfoList");
    return groupMemberInfoList;
  },
  
});