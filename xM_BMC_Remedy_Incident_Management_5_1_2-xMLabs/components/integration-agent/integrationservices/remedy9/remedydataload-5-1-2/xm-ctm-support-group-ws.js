// -----------------------------------------------------------------------------
// Encapsulates the operations available in the XM_CTS_SUPPORT_GROUP Web service.
//
// -----------------------------------------------------------------------------

var XM_CTM_SUPPORT_GROUP_WS = BaseClass.extend({

    LOG_SOURCE: "xm-ctm-support-group-ws.js: ",

    XM_CTM_SUPPORT_GROUP_WS_SOAP_VERSION: "1_1",

    // soapUI project file that contains definitions of Web service requests
    XM_CTM_SUPPORT_GROUP_WS_WSDL_DEFN: "integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedydataload"+INTEGRATION_VERSION_NUMBER+"/soap/XM-CTM-Support-Group-WS-soapui-project.xml",


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

        this.log.debug("XM_CTM_SUPPORT_GROUP_WS constructed. endPoint [" + this.endPoint + "]");
    },


    /**
     * -----------------------------------------------------------------------------------------------------------------
     * getSupportGroupList
     *
     * Returns an array of objects containing the results of the GroupList operation.
     *
     * -----------------------------------------------------------------------------------------------------------------
     */
    getSupportGroupList: function(qualification, startRecord, maxLimit)
    {
        this.log.debug("Enter - getSupportGroupList");

        var supportGroupList = [];

        this.log.debug("getSupportGroupList - qualification [" + qualification + "], startRecord [" + startRecord + "], maxLimit [" + maxLimit + "]");

        if (qualification == null)
        {
            throw new IllegalArgumentException("qualification is null");
        }

        if (startRecord == null)
        {
            throw new IllegalArgumentException("startRecord is null");
        }

        if (maxLimit == null)
        {
            throw new IllegalArgumentException("maxLimit is null");
        }

        try
        {
            // Get the parameterized SOAP message for this request from the soapUI project file
            var msg = new SOAPMessage(this.XM_CTM_SUPPORT_GROUP_WS_WSDL_DEFN, "GroupList", "GetGroupList", this.XM_CTM_SUPPORT_GROUP_WS_SOAP_VERSION);

            // Set the actual parameter values in the request
            msg.setParameter("userName", XM_CTM_WS_USERNAME);
            msg.setParameter("password", XM_CTM_WS_PASSWORD);
            msg.setParameter("qualification", qualification);
            msg.setParameter("startRecord", startRecord);
            msg.setParameter("maxLimit", maxLimit);

            var response = this.wsutil.sendReceive(this.endPoint, msg, this.headers);
            
            for each (var item in response.*::GroupListResponse.*::getListValues)
            {
              var group = this.wsutil.unmarshall(item, newRemedyObject());
              supportGroupList.push(group);
            }

        } 
        catch (e)
        {
            supportGroupList = null;
            handleError(e, "getSupportGroupList", this.XM_CTM_SUPPORT_GROUP_WS_SOAP_VERSION);
        }


        this.log.debug("supportGroupList: " + supportGroupList);
        this.log.debug("Exit - getSupportGroupList");

        return supportGroupList;
    }
});


