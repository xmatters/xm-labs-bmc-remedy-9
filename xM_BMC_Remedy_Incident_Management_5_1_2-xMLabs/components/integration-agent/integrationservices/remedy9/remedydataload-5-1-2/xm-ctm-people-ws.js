// -----------------------------------------------------------------------------
// Encapsulates the operations available in the XM_CTS_PEOPLE Web service.
//
// -----------------------------------------------------------------------------

var XM_CTM_PEOPLE_WS = BaseClass.extend({

    LOG_SOURCE: "xm-ctm-people-ws.js: ",

    XM_CTM_PEOPLE_WS_SOAP_VERSION: "1_1",

    // soapUI project file that contains definitions of Web service requests
    XM_CTM_PEOPLE_WS_WSDL_DEFN: "integrationservices/remedy"+PRODUCT_VERSION_NUMBER+"/remedydataload"+INTEGRATION_VERSION_NUMBER+"/soap/XM-CTM-People-WS-soapui-project.xml",

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

        this.log.debug("XM_CTM_PEOPLE_WS constructed. endPoint [" + this.endPoint + "]");
    },


    /**
     * -----------------------------------------------------------------------------------------------------------------
     * getPeopleList
     *
     * Returns a People list based on the qualification (search criteria),the startRecord and maximum number of records
     * to return.
     *
     * Returns null if no records are found.
     *
     * @param qualification - Remedy search criteria string
     * @param startRecord - zero-based offset of the first record to return
     * @param maxLimit - the maximum number of records to return in the list
     * -----------------------------------------------------------------------------------------------------------------
     */
    getPeopleList: function(qualification, startRecord, maxLimit)
    {
        this.log.debug("Enter - getPeopleList");

        var peopleList = [];

        this.log.debug("qualification [" + qualification + "], startRecord [" + startRecord + "], maxLimit [" + maxLimit + "]");

        if (qualification == null)
        {
            throw("getPeopleList - qualification is null");
        }

        if (startRecord == null)
        {
            throw("getPeopleList - startRecord is null");
        }

        if (maxLimit == null)
        {
            throw("getPeopleList - maxLimit is null");
        }

        try
        {
            // Get the parameterized SOAP message for this request from the soapUI project file
            var msg = new SOAPMessage(this.XM_CTM_PEOPLE_WS_WSDL_DEFN, "PeopleList", "GetPeopleList", this.XM_CTM_PEOPLE_WS_SOAP_VERSION);

//        this.log.debug("SOAPMessage [" + msg.getRequest() + "]");

            // Set the actual parameter values in the request
            msg.setParameter("userName", XM_CTM_WS_USERNAME);
            msg.setParameter("password", XM_CTM_WS_PASSWORD);

            msg.setParameter("qualification", qualification);
            msg.setParameter("startRecord", startRecord);
            msg.setParameter("maxLimit", maxLimit);

            var response = this.wsutil.sendReceive(this.endPoint, msg, this.headers);

            // The response from this function is an array of one or more "Person" objects created by
            // unmarshalling the XML into the properties of an object
            for each (var item in response.*::PeopleListResponse.*::getListValues)
            {
              var person = this.wsutil.unmarshall(item, newRemedyObject());
              peopleList.push(person);
            }

        } 
        catch (e)
        {
            peopleList = null;
            handleError(e, "getPeopleList", this.XM_CTM_PEOPLE_WS_SOAP_VERSION);
        }

        this.log.debug("Exit - getPeopleList");
        return peopleList;
    }
});

