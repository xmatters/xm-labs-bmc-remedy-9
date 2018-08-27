// -----------------------------------------------------------------------------
// Encapsulates the operations available in the XM_CTM_Support_Group_Association Web service.
//
// -----------------------------------------------------------------------------

var XM_CTM_SUPPORT_GROUP_ASSOC_WS = BaseClass.extend({

    LOG_SOURCE: "xm-ctm-supportgroupassoc-join-people-ws.js: ",

    XM_CTM_SUPPORT_GROUP_ASSOC_WS_SOAP_VERSION: "1_1",

    // soapUI project file that contains definitions of Web service requests
    XM_CTM_SUPPORTGROUPASSOC_JOIN_PEOPLE_WS_WSDL_DEFN: "integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedydataload"+INTEGRATION_VERSION_NUMBER+"/soap/XM-CTM-SupportGroupAssoc-join-People-WS-soapui-project.xml",

    /**
     * -----------------------------------------------------------------------------------------------------------------
     * Constructor
     *
     * @param endPoint - SOAP EndPoint URL
     * @param wsutil - Instance of the WSUtil Object
     * -----------------------------------------------------------------------------------------------------------------
     */
    init: function(wsutil, endPoint)
    {
        this.log = new Logger(this.LOG_SOURCE);
        this.wsutil = wsutil;
        this.endPoint = endPoint;
        this.headers = new HashMap();
        this.headers.put("Host", HOST_HEADER);

        this.log.debug("XM_CTM_SUPPORT_GROUP_ASSOC_WS constructed. endPoint [" + this.endPoint + "]");
    },

    /**
     * -----------------------------------------------------------------------------------------------------------------
     * getGroupMemberList
     *
     * Returns an array of objects containing the results of the GroupMemberList operation.
     *
     * This method doesn't support "chunking" via startRecord and maxLimit because the integration service has to
     * update the xMatters group in a single request.
     *
     * -----------------------------------------------------------------------------------------------------------------
     */
    getGroupMemberList: function(supportGroupId, startRecord, maxLimit)
    {
        this.log.debug("Enter - getGroupMemberList");

        var supportGroupMemberList = [];
        var qualificationTemplate = XM_CTM_PEOPLE_WS_BATCH_QUALIFICATION + " AND " + XM_CTM_SUPPORT_GROUP_ASSOC_WS_QUALIFICATION;

        this.log.debug("getGroupMemberList - supportGroupId [" + supportGroupId + "], qualificationTemplate [" + qualificationTemplate + "]");

        if (supportGroupId == null)
        {
            throw new IllegalArgumentException("supportGroupId is null");
        }

        try
        {
            // Get the parameterized SOAP message for this request from the soapUI project file
            var msg = new SOAPMessage(this.XM_CTM_SUPPORTGROUPASSOC_JOIN_PEOPLE_WS_WSDL_DEFN, "GroupMemberList", "GetGroupMemberList", this.XM_CTM_SUPPORT_GROUP_ASSOC_WS_SOAP_VERSION);

            // Set the actual parameter values in the request
            msg.setParameter("userName", XM_CTM_WS_USERNAME);
            msg.setParameter("password", XM_CTM_WS_PASSWORD);
            msg.setParameter("qualification", qualificationTemplate.replace("${GROUP_ID}", String(supportGroupId)));

            var response = this.wsutil.sendReceive(this.endPoint, msg, this.headers);
            
            for each (var item in response.*::GroupMemberListResponse.*::getListValues)
            {
              var member = this.wsutil.unmarshall(item, newRemedyObject());
              supportGroupMemberList.push(member);
            }

        } 
        catch (e)
        {
            supportGroupMemberList = null;
            handleError(e, "getGroupMemberList", this.XM_CTM_SUPPORT_GROUP_ASSOC_WS_SOAP_VERSION);
        }

        this.log.debug("supportGroupList: " + supportGroupMemberList);
        this.log.debug("Exit - getGroupMemberList");

        return supportGroupMemberList;
    }
});


