var SOAPFault = BaseClass.extend({

  LOG_SOURCE: "soapfault.js: ",

  /**
   * Constructor
   * @param fault XML response body containing the SOAP Fault
   * @param version SOAP version to determine the initialization of the class
   */
  init: function(fault, version)
  {
    this.log = new Logger(this.LOG_SOURCE);
    
    // Initialize the fault variables
    this.faultcode = null;
    this.faultstring = null;
    this.faultactor = null;
    this.detail = null;
    this.code = null;
    this.node = null;
    this.role = null;
    this.reason = null;
    this.message = fault;
    
    try
    {
      if ("1_1".equals(version))
      {
        var soap = new Namespace("http://schemas.xmlsoap.org/soap/envelope/");
        var faultXml = new XML(this.formatStringForE4X(fault)).soap::Body.soap::Fault;
        this.faultcode = faultXml.faultcode;
        this.faultstring = faultXml.faultstring;
        this.faultactor = faultXml.faultactor;
        this.detail = faultXml.detail;
      }
      else if ("1_2".equals(version))
      {
        var soap = new Namespace("http://www.w3.org/2003/05/soap-envelope");
        var faultXml = new XML(this.formatStringForE4X(fault)).soap::Body.soap::Fault;
        this.code = new Object();
        this.code.value = faultXml.soap::Code.soap::Value;
        this.code.subcode = faultXml.soap::Code.soap::Subcode;
        this.detail = faultXml.soap::Detail;
        this.node = faultXml.soap::Node;
        this.role = faultXml.soap::Role;
        this.reason = new ArrayList();
            
        var reasonList = faultXml.soap::Reason.soap::Text;
        for each (item in reasonList) 
        {
          this.reason.add(item.toString());
        }
      }
    }
    catch (e)
    {
      this.message = fault;
    }
  },
      /**
   * At implementation time it was found that Mozilla's implementation of E4X
   * does not support XML declarations (<? ... ?>), therefore if it exists in
   * the payload returned from a webservice call, it needs to be stripped out.
   * http://www.xml.com/pub/a/2007/11/28/introducing-e4x.html?page=4
   *
   * This method takes a parameter:
   * 1. Ensures it is a string
   * 2. Removes any XML declarations
   * 3. returns a string which can be used to create E4X objects such as
   *    XML or XMLList.
   */
  formatStringForE4X: function(string)
  {
    string = string.toString();
    string = string.replace(/<\?(.*?)\?>/g,'');
    return string;
  }
});