importPackage(java.util);
importClass(Packages.com.alarmpoint.integrationagent.http.HttpClientWrapper);
importClass(Packages.com.alarmpoint.integrationagent.http.DefaultX509TrustManager);
importClass(Packages.com.alarmpoint.integrationagent.soap.SOAPMessage);
importClass(Packages.com.alarmpoint.integrationagent.soap.SOAPRequest);
importClass(Packages.com.alarmpoint.integrationagent.soap.exception.SOAPRequestException);
importClass(Packages.javax.net.ssl.SSLContext);
importClass(Packages.javax.net.ssl.TrustManager);
importClass(Packages.org.apache.commons.lang.StringEscapeUtils);
importClass(Packages.org.apache.http.conn.ssl.SSLSocketFactory);

// Add functionality to the JavaScript String prototype
String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$/g,"");
}
String.prototype.ltrim = function() {
  return this.replace(/^\s+/,"");
}
String.prototype.rtrim = function() {
  return this.replace(/\s+$/,"");
}
String.prototype.endsWith = function(pattern) {
    var d = this.length - pattern.length;
    return d >= 0 && this.lastIndexOf(pattern) === d;
}
String.prototype.startsWith = function(str){
    return (this.indexOf(str) === 0);
}

var soapRequestMap = new HashMap();
var httpClientMap = new HashMap();

var WSUtil = BaseClass.extend({

  LOG_SOURCE: "wsutil.js: ",

  // HTTP Methods
  POST: "POST",
  GET: "GET",
  PUT: "PUT",
  HEAD: "HEAD",

  // Use SSL but trust any certificate (including self-signed ones).
  // This SHOULD NOT be used for productive systems due to security reasons, 
  // unless it is a conscious decision and you are perfectly aware of security 
  // implications of accepting self-signed certificates  
  ACCEPT_ANY_CERTIFICATE: true,
  
  // File/Path for the Java Keystore containing the trusted certificate chain
  KEY_STORE: "jre/lib/security/cacerts",
  
  // Password for the Java Keystore containing the trusted certificate chain
  KEY_STORE_PASSWORD: "changeit",
  
  // SSL Socket Factory used for SSL communication
  SSL_SOCKET_FACTORY: null,

  // Determines connection pooling behaviour. Default is to re-use HTTP 
  // connections.
  CLOSE_CONNECTION_PER_REQUEST: false,
  
  // HTTP connection constants
  MAX_CONNECTIONS: 20,
  IDLE_CONNECTION_TIMEOUT_MILLIS: 30000,
  CONNECTION_ESTABLISH_TIMEOUT_MILLIS: 30000,
  CONNECTION_READ_TIMEOUT_MILLIS: 30000,
  STALE_CONNECTION_CHECK: true,
  
  PROXY_CONFIG : {
          hostIp : null,
          port : 0,
          username : null,
          password : null,
          ntlmDomain : null
  },
  
  /**
   * Constructor
   */
  init: function()
  {
    this.log = new Logger(this.LOG_SOURCE);
  },

  /**
   * @param hostIp - the IP address of the proxy server (required -- if null or "", then proxy settings will be ignored)
   * @param port - the integer port number of the proxy server (required)
   * @param username - proxy user name, if proxy authentication is required, else null or ""
   * @param password - proxy password, if proxy authentication is required, else null or ""
   * @param ntlmDomain - set to null unless NTLM proxy authentication is required.
   */
  initProxy: function(hostIp, port, username, password, ntlmDomain) {
    this.PROXY_CONFIG.hostIp = hostIp;
    this.PROXY_CONFIG.port = (port == null) ? 0 : port;
    this.PROXY_CONFIG.username = username;
    this.PROXY_CONFIG.password = password;
    this.PROXY_CONFIG.ntlmDomain = ntlmDomain;
  },
  
  /**
   * Sends the request to the SOAP endpoint and returns the response
   * @param url EndPoint for the webservice request
   * @param msg SOAPMessage instance containing the SOAPEnvelope to post
   * @param headers array of SOAP Headers to be added to the SOAP Request
   * @return SOAP Response Body
   */
  sendReceive: function(url, msg, headers)
  {
    this.log.debug("\tEntering sendReceive with url: " + url + " and msg: " + msg );
    // These variables are used by E4X to access nodes prefixed with a namespace. These namespaces are defined
    // in the SOAP Response that is parsed by E4X
    var soap = new Namespace("http://schemas.xmlsoap.org/soap/envelope/");
    var soapRequest = soapRequestMap.get(url);
    var acceptAnyCertificate = this.ACCEPT_ANY_CERTIFICATE;

    if (soapRequest == null)
    {
      if (url.toLowerCase().startsWith("https"))
      {
        if (!acceptAnyCertificate)
        {
          this.getSSLSocketFactory();
        }
      }
      else
      {
        acceptAnyCertificate = false;
      }
      soapRequest = new SOAPRequest(url, msg.getAction(), acceptAnyCertificate, this.SSL_SOCKET_FACTORY, this.MAX_CONNECTIONS, this.IDLE_CONNECTION_TIMEOUT_MILLIS, this.CONNECTION_ESTABLISH_TIMEOUT_MILLIS, this.CONNECTION_READ_TIMEOUT_MILLIS, this.STALE_CONNECTION_CHECK, null);
      soapRequest.setCloseConnection(this.CLOSE_CONNECTION_PER_REQUEST);
      soapRequest.setupProxy(this.PROXY_CONFIG.hostIp, this.PROXY_CONFIG.port, this.PROXY_CONFIG.username, this.PROXY_CONFIG.password, this.PROXY_CONFIG.ntlmDomain);
      soapRequestMap.put(url, soapRequest);
    }

    if (headers != null)
    {
      for (var it = headers.keySet().iterator(); it.hasNext();)
      {
        var key = it.next();
        var value = headers.get(key);
        soapRequest.getSoapHeaders().put(key, value);
      }
    }
    soapRequest.setAction(msg.getAction());
    var response = soapRequest.post(msg.getSoapEnvelope(msg.getRequest()));
    var soapBody = new XML(this.formatStringForE4X(String(response))).soap::Body;
    this.log.debug("\tExiting sendReceive with response body: " + soapBody.toString() );
    return soapBody;
  },
  
    /**
   * Sends the request to the REST endpoint and returns the response
   * @param protocol HTTP or HTTPS
   * @param server FQDN or IP of the server hosting the REST service
   * @param port integer representing the port the REST service is exposed on
   * @param rootPath path for the REST service
   * @param username name of the user making the request
   * @param password clear text password (that will be encrypted prior to sending to the REST service) 
   * @param method String representing the request method (GET, POST, PUT etc)
   * @param request body of the request to send to the REST Service
   * @param headers array of Request Headers to be added to the Request
   * @return Response Body
   */
  restSendReceive: function(protocol, server, port, rootPath, username, password, method, request, headers)
  {
    this.log.debug("\tEntering restSendReceive with protocol: " + protocol + ", server: " + server + ", port: " + port + ", rootPath: " + rootPath + ", method: " + method + ", and request: " + request );
    var key = protocol + "|" + server + "|" + port + "|" + rootPath;
    var httpClient = httpClientMap.get(key);
    var acceptAnyCertificate = this.ACCEPT_ANY_CERTIFICATE;
    
    if (httpClient == null)
    {
      if (protocol.toLowerCase().startsWith("https"))
      {
        if (!acceptAnyCertificate)
        {
          this.getSSLSocketFactory();
        }
      }
      else
      {
        acceptAnyCertificate = false;
      }
      httpClient = new HttpClientWrapper(username, password, server, port, rootPath, acceptAnyCertificate, this.SSL_SOCKET_FACTORY, this.MAX_CONNECTIONS, this.IDLE_CONNECTION_TIMEOUT_MILLIS, this.CONNECTION_ESTABLISH_TIMEOUT_MILLIS, this.CONNECTION_READ_TIMEOUT_MILLIS, this.STALE_CONNECTION_CHECK);
      httpClient.setCloseConnection(this.CLOSE_CONNECTION_PER_REQUEST);
      httpClient.setupProxy(this.PROXY_CONFIG.hostIp, this.PROXY_CONFIG.port, this.PROXY_CONFIG.username, this.PROXY_CONFIG.password, this.PROXY_CONFIG.ntlmDomain);
      httpClientMap.put(key, httpClient);
    }
    
    if (headers != null)
    {
      for (var it = headers.keySet().iterator(); it.hasNext();)
      {
        var key = it.next();
        var value = headers.get(key);
        httpClient.addHeader(key, value);
        this.log.debug("\t\tAdding header: " + key + " with value: " + value );
      }
    }
    
    var response = null;
    var responseStr = "";
    if (this.POST.equalsIgnoreCase(method))
    {
      response = httpClient.executeHttpPost(request);
      responseStr = httpClient.getResponseAsString(response);
    }
    else if (this.GET.equalsIgnoreCase(method))
    {
      response = httpClient.executeHttpGet();
      responseStr = httpClient.getResponseAsString(response);
    }
    else if (this.PUT.equalsIgnoreCase(method))
    {
      response = httpClient.executeHttpPut(request);
      responseStr = httpClient.getResponseAsString(response);
    }
    
    //If there is a response body we are probably more interested in that so return it.
    if (responseStr != "")
    {
      this.log.debug("\trestSendReceive - Received response with body: " + responseStr);
      response = responseStr;
    }
    else
	{
		this.log.debug("\trestSendReceive - Received response: " + response.toString() );
 	}
	return response;
  },

  /**
   * Encodes the given string using the base64 algorithm
   * @param msg String to encode
   * @return a base64 encrypted String
   */
  base64Encode: function(msg)
  {
      return Base64.getEncoder().encodeToString( new java.lang.String(msg).getBytes("UTF8") );
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
    string = "" + string; // making sure this is JS string
  	string = string.replace(/<\?(.*?)\?>/g,''); // remove XML processing instructions
    return string;
  },

  /**
   * Unmarshalls the XML response into the instance variables. Assumes that the
   * instance variable matches the node name.
   * @param xml instance of the XML document to convert
   * @param object instance of the object to unmarshall the XML into
   */
  unmarshall: function(xml, object)
  {
    this.log.debug("Entering unmarshall with xml message: " + xml.toString() );
    for each (var field in xml.children())
    {
      var fieldName = field.name().localName;
      if (field.hasComplexContent())
      {
        // Recurse into the child element to process the children
        var child = new Object();
        this.unmarshall(field, child);
        // Check if the property already exists in this object
        if(object.hasOwnProperty(fieldName))
        {
          // If so it looks like this is an array of something
          if(!(object[fieldName] instanceof Array))
          {
            object[fieldName] = [ object[fieldName] ];
          }
          object[fieldName].push(child);
        }
        else
        {
          object[fieldName] = child;
        }
      }
      else 
      {
        object[fieldName] = String(field);
      }
    }
    this.log.debug("Exiting unmarshall..." );
    return object;
  },
  

  /**
   * The default implementation of SSL between the IA and REST/SOAP endpoints
   * will allow for self-signed certificates. To implement more secure SSL
   * communication, an instance of an X509TrustManager should be created that
   * points to the keystore containing a signed certificate with the appropriate
   * credentials.
   *
   * The trusted certificate MUST be imported into the Java Keystore used by
   * the Integration Agent (conf/.keystore) using the credentials defined above.
   * In order for the trust chain to be enabled, the ACCEPT_ANY_CERTIFICATE
   * property above MUST be set to false                                         
   */
  getSSLSocketFactory: function()
  {
    if (this.SSL_SOCKET_FACTORY == null)
    {
      var sslContext = SSLContext.getInstance("TLS");
      var trustManagers = java.lang.reflect.Array.newInstance(TrustManager, 1);
      trustManagers[0] = new DefaultX509TrustManager(this.KEY_STORE, this.KEY_STORE_PASSWORD); 
      sslContext.init(null, trustManagers , null);
      this.SSL_SOCKET_FACTORY = new SSLSocketFactory(sslContext, SSLSocketFactory.STRICT_HOSTNAME_VERIFIER);
    }
    return this.SSL_SOCKET_FACTORY;
  }
});
