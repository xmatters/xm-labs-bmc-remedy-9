// -----------------------------------------------------------------------------
// Encapsulates the operations available in the XM_CTM_SupportGroupFunctionalRole_WS Web service.
//
// -----------------------------------------------------------------------------

var XM_CTM_SUPPORT_GROUP_FUNCTIONAL_ROLE_WS = BaseClass.extend({

    LOG_SOURCE: "xm-ctm-support-group-functional-role-ws.js: ",

    XM_CTM_SUPPORT_GROUP_FUNCTIONAL_ROLE_WS_SOAP_VERSION: "1_1",

    // soapUI project file that contains definitions of Web service requests
    XM_CTM_SUPPORT_GROUP_FUNCTIONAL_ROLE_WS_WSDL_DEFN: "integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedydataload"+INTEGRATION_VERSION_NUMBER+"/soap/XM-CTM-SupportGroupFunctionalRole-WS-soapui-project.xml",

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

        this.log.debug("XM_CTM_SUPPORT_GROUP_FUNCTIONAL_ROLE_WS constructed. endPoint [" + this.endPoint + "]");
    },

    /**
     * -----------------------------------------------------------------------------------------------------------------
     * getGroupRoleList
     *
     * Returns an array of objects containing the results of the GroupRoleList operation.
     *
     *
     * -----------------------------------------------------------------------------------------------------------------
     */
    getGroupRoleList: function(loginId)
    {
        this.log.debug("Enter - getGroupRoleList");

        var supportGroupRoleList = [];
        var qualificationTemplate = XM_CTM_SUPPORT_GROUP_FUNCTIONAL_ROLE_WS_QUALIFICATION;

        this.log.debug("getGroupRoleList - loginId [" + loginId + "], qualificationTemplate [" + qualificationTemplate + "]");

        if (loginId == null)
        {
            throw new IllegalArgumentException("loginId is null");
        }

        try
        {
            // Get the parameterized SOAP message for this request from the soapUI project file
            var msg = new SOAPMessage(this.XM_CTM_SUPPORT_GROUP_FUNCTIONAL_ROLE_WS_WSDL_DEFN, "GroupRoleList", "GetGroupRoleList", this.XM_CTM_SUPPORT_GROUP_FUNCTIONAL_ROLE_WS_SOAP_VERSION);

            // Set the actual parameter values in the request
            msg.setParameter("userName", XM_CTM_WS_USERNAME);
            msg.setParameter("password", XM_CTM_WS_PASSWORD);
            msg.setParameter("qualification", qualificationTemplate.replace("${LOGIN_ID}", String(loginId)));

            var response = this.wsutil.sendReceive(this.endPoint, msg, this.headers);
            
            for each (var item in response.*::GroupRoleListResponse.*::getListValues)
            {
              var role = this.wsutil.unmarshall(item, newRemedyObject());
              supportGroupRoleList.push(role);
            }

        } 
        catch (e)
        {
            supportGroupRoleList = null;
            handleError(e, "getGroupRoleList", this.XM_CTM_SUPPORT_GROUP_FUNCTIONAL_ROLE_WS_SOAP_VERSION);
        }

        this.log.debug("supportGroupList: " + supportGroupRoleList);
        this.log.debug("Exit - getGroupRoleList");

        return supportGroupRoleList;
    },
});


