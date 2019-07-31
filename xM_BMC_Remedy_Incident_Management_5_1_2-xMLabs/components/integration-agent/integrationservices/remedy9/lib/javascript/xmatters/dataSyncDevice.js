/******************************************************************************/
/*                Start of Data Sync Device Object Definition                 */
/******************************************************************************/

// JavaScript Object to hold Device information for webservice calls
var Device = xMattersWS.extend({

  LOG_SOURCE: "dataSyncDevice.js: ",

  OK: "OK",
  EMPTY_RESULT_SET: "EMPTY_RESULT_SET",
  UNKNOWN_DEVICE: "UNKNOWN_DEVICE",
  PHONE_REGEX: /(\d{3})(\d{7})(\d*)$/,
  
  /**
   * Initialize the class variables
   * @param deviceType identifies the device type that is being processed.
   * @param owner identifies the user the device belongs to
   * @param deviceName name of the device in xMatters
   * @param name user service provider
   */
  init: function(deviceType, owner, deviceName, name)
  {
    this._super();
    this.deviceType = deviceType;
  
    this.owner = owner;
    this.active = true;
    this.defaultDevice = false;
    this.delay = 0;
    this.externallyOwned = false;
    this.deviceName = deviceName;
    this.priorityThreshold = "LOW";
    this.identifier = "1";
    this.name = name;
    this.deviceIdentifier = "";
    this.isDelete = false;
    
    this.deviceExists = null;
    
    // Populate this instance from the xMatters data if it exists
    var xMattersDeviceXml = this.query();
    if (this.deviceExists)
    {
      this.xmlToObject(xMattersDeviceXml.xmns::FindDevicesResponse.child(QName(xmns, "return")).xmns::devices.child(QName(xmns, this.deviceType + "Device")));
    }
  },
  
  /**
   * Creates an Add Request for the device
   * @return instance of the SOAPMessage populated to send to the webservice
   */
  add: function()
  {
    var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "AddDevice", "Add" + this.deviceType + "Device", this.XM_SOAP_VERSION);
    this.initializeAddOrUpdate(msg);
    return msg;
  },

  /**
   * Creates an update request for the device
   * @return instance of the SOAPMessage populated to send to the webservice
   */
  update: function()
  {
    if (this.exists())
    {
      var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "UpdateDevice", "Update" + this.deviceType + "Device", this.XM_SOAP_VERSION);
      this.initializeAddOrUpdate(msg);
      msg.setParameter("deviceIdentifier", this.deviceIdentifier);
      return msg;
    }
    throw this.UNKNOWN_DEVICE;
  },

  /**
   * Initialize the SOAPMessage with the common attributes for add or update
   * @param msg instance of the SOAPMessage to initialize
   */
  initializeAddOrUpdate: function(msg)
  {
    msg.setParameter("user", this.wsUser);
    msg.setParameter("password", this.wsPassword);
    msg.setParameter("company", this.wsCompany);
    msg.setParameter("owner", this.owner);
    msg.setParameter("active", this.active);
    msg.setParameter("default", this.defaultDevice);
    msg.setParameter("delay", this.delay);
    msg.setParameter("externallyOwned", this.externallyOwned);
    msg.setParameter("deviceName", this.deviceName);
    msg.setParameter("priorityThreshold", this.priorityThreshold);
    msg.setParameter("identifier", this.identifier);
    msg.setParameter("name", this.name);
  },
  
  /**
   * Remove the device from xMatters
   */
  remove: function()
  {
    // Retrieve the device information as the update requires the device id
    if(this.exists())
    {
      var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "DeleteDevice", "DeleteDevice", this.XM_SOAP_VERSION);

      msg.setParameter("user", this.wsUser);
      msg.setParameter("password", this.wsPassword);
      msg.setParameter("company", this.wsCompany);
      msg.setParameter("deviceIdentifier", this.deviceIdentifier);
    
      return this.syncSendReceive(this.endPoint, msg, "Delete Device", this.owner + "|" + this.deviceName).xmns::DeleteDeviceResponse.child(QName(xmns, "return")).xmns::status;
    }
    throw this.UNKNOWN_DEVICE;
  },
  
  /**
   * Checks if the device exists in xMatters.
   */
  exists: function()
  {
    if (this.deviceExists == null)
    {
      this.query();
    }
    return this.deviceExists;
  },

  /**
   * Queries for the device exists in xMatters.
   */
  query: function()
  {
    var msg = new SOAPMessage(this.XMATTERS_WSDL_DEFN, "FindDevices", "FindDevices", this.XM_SOAP_VERSION);

    msg.setParameter("user", this.wsUser);
    msg.setParameter("password", this.wsPassword);
    msg.setParameter("company", this.wsCompany);
    msg.setParameter("owner", this.owner);
    msg.setParameter("targetName", this.owner + "|" + this.deviceName);
    
    var response = this.sendReceive(this.endPoint, msg);
    this.deviceExists = this.OK.equalsIgnoreCase(response.xmns::FindDevicesResponse.child(QName(xmns, "return")).xmns::status);
    
    if (this.deviceExists)
    {
      var devices = response.xmns::FindDevicesResponse.child(QName(xmns, "return")).xmns::devices.child(QName(xmns, this.deviceType + "Device"));
      this.deviceIdentifier = devices.xmns::deviceIdentifier;
    }
    return response;
  },
  
  /**
   * Populates this instance from the XML document
   * @param xml instance of the XML document to convert
   */
  xmlToObject: function(xml)
  {
    this.active = xml.xmns::active;
    this.defaultDevice = xml.child(QName(xmns, "default"));
    this.delay = xml.xmns::delay;
    this.externallyOwned = xml.xmns::externallyOwned;    
    this.deviceName = xml.xmns::name;
    this.priorityThreshold = xml.xmns::priorityThreshold;
    this.identifier = xml.xmns::userServiceProvider.xmns::identifier;
    this.name = xml.xmns::userServiceProvider.xmns::name;
  }
  
});

/**
 * Blackberry Device - subclass of Device
 */
var BlackberryDevice = Device.extend({

  init: function(owner, deviceName, provider)
  {
    if ( provider == null ) 
      provider = "BES";
      
    this.pinOrEmail = "";
    this._super("blackberry", owner, deviceName, provider);
  },
  
  /**
   * Add the Blackberry device to xMatters
   * @return response body from the SOAP Response
   */
  add: function()
  {
    var msg = this._super();
    msg.setParameter("pinOrEmail", this.pinOrEmail);
    return this.syncSendReceive(this.endPoint, msg, "Add Blackberry Device", this.owner + "|" + this.deviceName).xmns::AddDeviceResponse.child(QName(xmns, "return")).xmns::status;
  },

  /**
   * Update the Blackberry device in xMatters
   * @return response body from the SOAP Response
   */
  update: function()
  {
    var msg = this._super();
    msg.setParameter("pinOrEmail", this.pinOrEmail);
    return this.syncSendReceive(this.endPoint, msg, "Update Blackberry Device", this.owner + "|" + this.deviceName).xmns::UpdateDeviceResponse.child(QName(xmns, "return")).xmns::status;
  },
  
  /**
   * Checks that the Blackberry device information has been provided
   */
  isValid: function()
  {
    return !"".equalsIgnoreCase(this.pinOrEmail);
  },

  /**
   * Populates this instance from the XML document
   * @param xml instance of the XML document to convert
   */
  xmlToObject: function(xml)
  {
    this._super(xml);
    this.pinOrEmail = xml.xmns::pinOrEmail;
  }
  
});

/**
 * Email Device - subclass of Device
 */
var EmailDevice = Device.extend({

  init: function(owner, deviceName, provider)
  {
    if ( provider == null ) 
      provider = "SMTP Email";
	  
    this.address = "";
    this._super("email", owner, deviceName, provider);
  },
  
  /**
   * Add the email device to xMatters
   * @return response body from the SOAP Response
   */
  add: function()
  {
    var msg = this._super();
    msg.setParameter("address", this.address);
    return this.syncSendReceive(this.endPoint, msg, "Add Email Device", this.owner + "|" + this.deviceName).xmns::AddDeviceResponse.child(QName(xmns, "return")).xmns::status;
  },

  /**
   * Update the email device in xMatters
   * @return response body from the SOAP Response
   */
  update: function()
  {
    var msg = this._super();
    msg.setParameter("address", this.address);
    return this.syncSendReceive(this.endPoint, msg, "Update Email Device", this.owner + "|" + this.deviceName).xmns::UpdateDeviceResponse.child(QName(xmns, "return")).xmns::status;
  },

  /**
   * Checks that the email device information has been provided
   */
  isValid: function()
  {
    return !"".equalsIgnoreCase(this.address);
  },

  /**
   * Populates this instance from the XML document
   * @param xml instance of the XML document to convert
   */
  xmlToObject: function(xml)
  {
    this._super(xml);
    this.address = xml.xmns::address;
  }
  
});

/**
 * Generic Device - subclass of Device
 */
var GenericDevice = Device.extend({

  init: function(owner, deviceName)
  {
    this._super("generic", owner, deviceName, "");
    this.pin = "";
  },
  
  /**
   * Add the Generic device to xMatters
   * @return response body from the SOAP Response
   */
  add: function()
  {
    var msg = this._super();
    msg.setParameter("pin", this.pin);
    return this.syncSendReceive(this.endPoint, msg, "Add Generic Device", this.owner + "|" + this.deviceName).xmns::AddDeviceResponse.child(QName(xmns, "return")).xmns::status;
  },

  /**
   * Update the Generic device in xMatters
   * @return response body from the SOAP Response
   */
  update: function()
  {
    var msg = this._super();
    msg.setParameter("pin", this.pin);
    return this.syncSendReceive(this.endPoint, msg, "Update Generic Device", this.owner + "|" + this.deviceName).xmns::UpdateDeviceResponse.child(QName(xmns, "return")).xmns::status;
  },

  /**
   * Checks that the generic device information has been provided
   */
  isValid: function()
  {
    return !"".equalsIgnoreCase(this.pin);
  },

  /**
   * Populates this instance from the XML document
   * @param xml instance of the XML document to convert
   */
  xmlToObject: function(xml)
  {
    this._super(xml);
    this.pin = xml.xmns::pin;
  }
  
});

/**
 * IM Device - subclass of Device
 */
var IMDevice = Device.extend({

  init: function(owner, deviceName, provider)
  {
    if ( provider == null ) 
      provider = "Jabber COM";
      
    this.address = "";
    this._super("im", owner, deviceName, provider);
  },
  
  /**
   * Add the IM device to xMatters
   * @return response body from the SOAP Response
   */
  add: function()
  {
    var msg = this._super();
    msg.setParameter("address", this.address);
    return this.syncSendReceive(this.endPoint, msg, "Add IM Device", this.owner + "|" + this.deviceName).xmns::AddDeviceResponse.child(QName(xmns, "return")).xmns::status;
  },

  /**
   * Update the IM device in xMatters
   * @return response body from the SOAP Response
   */
  update: function()
  {
    var msg = this._super();
    msg.setParameter("address", this.address);
    return this.syncSendReceive(this.endPoint, msg, "Update IM Device", this.owner + "|" + this.deviceName).xmns::UpdateDeviceResponse.child(QName(xmns, "return")).xmns::status;
  },

  /**
   * Checks that the IM device information has been provided
   */
  isValid: function()
  {
    return !"".equalsIgnoreCase(this.address);
  },
  
  /**
   * Populates this instance from the XML document
   * @param xml instance of the XML document to convert
   */
  xmlToObject: function(xml)
  {
    this._super(xml);
    this.address = xml.xmns::address;
  }
  
});

/**
 * NumericPager Device - subclass of Device
 */
var NumericPagerDevice = Device.extend({

  init: function(owner, deviceName, provider)
  {
    if ( provider == null ) 
      provider = "SkyPage Numeric Pager";
      
    this.areaCode = "";
    this.countryCodeOverride = "";
    this.number = "";
    this.pin = "";
    this._super("numericPager", owner, deviceName, provider);
    
  },
  
  /**
   * Add the NumericPager device to xMatters
   * @return response body from the SOAP Response
   */
  add: function()
  {
    var msg = this._super();
    msg.setParameter("areaCode", this.areaCode);
    msg.setParameter("countryCodeOverride", this.countryCodeOverride);
    msg.setParameter("number", this.number);
    msg.setParameter("pin", this.pin);
    return this.syncSendReceive(this.endPoint, msg, "Add NumericPager Device", this.owner + "|" + this.deviceName).xmns::AddDeviceResponse.child(QName(xmns, "return")).xmns::status;
  },

  /**
   * Update the NumericPager device in xMatters
   * @return response body from the SOAP Response
   */
  update: function()
  {
    var msg = this._super();
    msg.setParameter("areaCode", this.areaCode);
    msg.setParameter("countryCodeOverride", this.countryCodeOverride);
    msg.setParameter("number", this.number);
    msg.setParameter("pin", this.pin);
    return this.syncSendReceive(this.endPoint, msg, "Update NumericPager Device", this.owner + "|" + this.deviceName).xmns::UpdateDeviceResponse.child(QName(xmns, "return")).xmns::status;
  },

  /**
   * Checks that the NumericPager device information has been provided. The
   * device should contain a number OR a pin, but NOT both.
   */
  isValid: function()
  {
    return (!"".equalsIgnoreCase(this.number)
        || !"".equalsIgnoreCase(this.pin))
        && (!(!"".equalsIgnoreCase(this.number) && !"".equalsIgnoreCase(this.pin)));
  },
  
  /**
   * Populates this instance from the XML document
   * @param xml instance of the XML document to convert
   */
  xmlToObject: function(xml)
  {
    this._super(xml);
    this.areaCode = xml.xmns::areaCode;
    this.countryCodeOverride = xml.xmns::countryCodeOverride;
    this.number = xml.xmns::number;
    this.pin = xml.xmns::pin;
  }
  
});

/**
 * TextPager Device - subclass of Device
 */
var TextPagerDevice = Device.extend({

  init: function(owner, deviceName, provider)
  {
    if ( provider == null ) 
      provider = "Virtual Text Pager";
      
    this.pin = "";
    this.twoWay = "false";
    this._super("textPager", owner, deviceName, provider);
  },
  
  /**
   * Add the TextPager device to xMatters
   * @return response body from the SOAP Response
   */
  add: function()
  {
    var msg = this._super();
    msg.setParameter("pin", this.pin);
    msg.setParameter("two_way", this.twoWay);
    return this.syncSendReceive(this.endPoint, msg, "Add TextPager Device", this.owner + "|" + this.deviceName).xmns::AddDeviceResponse.child(QName(xmns, "return")).xmns::status;
  },

  /**
   * Update the TextPager device in xMatters
   * @return response body from the SOAP Response
   */
  update: function()
  {
    var msg = this._super();
    msg.setParameter("pin", this.pin);
    msg.setParameter("two_way", this.twoWay);
    return this.syncSendReceive(this.endPoint, msg, "Update TextPager Device", this.owner + "|" + this.deviceName).xmns::UpdateDeviceResponse.child(QName(xmns, "return")).xmns::status;
  },
  
  /**
   * Checks that the TextPager device information has been provided
   */
  isValid: function()
  {
    return !"".equalsIgnoreCase(this.pin);
  },

  /**
   * Populates this instance from the XML document
   * @param xml instance of the XML document to convert
   */
  xmlToObject: function(xml)
  {
    this._super(xml);
    this.pin = xml.xmns::pin;
    this.twoWay = xml.xmns::two_way;
  }
  
    
});

/**
 * TextPhone Device - subclass of Device
 */
var TextPhoneDevice = Device.extend({

  init: function(owner, deviceName, provider)
  {
    if ( provider == null ) 
      provider = "Virtual Text Phone";
      
    this.number = "";
    this._super("textPhone", owner, deviceName, provider);
  },
  
  /**
   * Add the TextPhone device to xMatters
   * @return response body from the SOAP Response
   */
  add: function()
  {
    var msg = this._super();
    msg.setParameter("number", this.number);
    return this.syncSendReceive(this.endPoint, msg, "Add TextPhone Device", this.owner + "|" + this.deviceName).xmns::AddDeviceResponse.child(QName(xmns, "return")).xmns::status;
  },

  /**
   * Update the TextPhone device in xMatters
   * @return response body from the SOAP Response
   */
  update: function()
  {
    var msg = this._super();
    msg.setParameter("number", this.number);
    return this.syncSendReceive(this.endPoint, msg, "Update TextPhone Device", this.owner + "|" + this.deviceName).xmns::UpdateDeviceResponse.child(QName(xmns, "return")).xmns::status;
  },
  
  /**
   * Checks that the TextPhone device information has been provided
   */
  isValid: function()
  {
    return !"".equalsIgnoreCase(this.number);
  },
  
  /**
   * Populates this instance from the XML document
   * @param xml instance of the XML document to convert
   */
  xmlToObject: function(xml)
  {
    this._super(xml);
    this.number = xml.xmns::number;
  }
  
});

/**
 * Voice Device - subclass of Device
 */
var VoiceDevice = Device.extend({

  init: function(owner, deviceName, provider)
  {
    if ( provider == null ) 
      provider = "Phone Engine";
      
    this.areaCode = "";
    this.countryCodeOverride = "";
    this.extension = "";
    this.number = "";
    this._super("voice", owner, deviceName, provider);
   
  },
  
  /**
   * Add the Voice device to xMatters
   * @return response body from the SOAP Response
   */
  add: function()
  {
    var msg = this._super();
    msg.setParameter("areaCode", this.areaCode);
    msg.setParameter("countryCodeOverride", this.countryCodeOverride);
    msg.setParameter("extension", this.extension);
    msg.setParameter("number", this.number);
    return this.syncSendReceive(this.endPoint, msg, "Add Voice Device", this.owner + "|" + this.deviceName).xmns::AddDeviceResponse.child(QName(xmns, "return")).xmns::status;
  },

  /**
   * Update the Voice device in xMatters
   * @return response body from the SOAP Response
   */
  update: function()
  {
    var msg = this._super();
    msg.setParameter("areaCode", this.areaCode);
    msg.setParameter("countryCodeOverride", this.countryCodeOverride);
    msg.setParameter("extension", this.extension);
    msg.setParameter("number", this.number);
    return this.syncSendReceive(this.endPoint, msg, "Update Voice Device", this.owner + "|" + this.deviceName).xmns::UpdateDeviceResponse.child(QName(xmns, "return")).xmns::status;
  },
  
  /**
   * Checks that the Voice device information has been provided
   */
  isValid: function()
  {
    return !"".equalsIgnoreCase(this.number);
  },
  
  /**
   * Parses the number provided into the phone fields using the regex
   * @param phoneNumber phone number to parse
   * @param regex optional regular expression. If no regex is provided, the
   *        default regex will be used.
   */
  parse: function(phoneNumber, regex)
  {
    if (phoneNumber != null && !"".equalsIgnoreCase(phoneNumber))
    {
      // Try and parse the phone number into the area code, country code extension and number if possible
      var phoneNo = phoneNumber.toString();
      var phoneRegex = regex != null ? regex : this.PHONE_REGEX;
      phoneNo = phoneNo.replace(/[^\d\.]+/g, '');
            
      if (phoneRegex.test(phoneNo)) 
      {
        this.areaCode = phoneNo.replace(phoneRegex, "$1");
        this.number = phoneNo.replace(phoneRegex, "$2");
        this.extension = phoneNo.replace(phoneRegex, "$3");
      }
      else 
      {
        this.areaCode = "";
        this.number = phoneNo;
        this.extension = "";
      }
    }
  },
  
  /**
   * Populates this instance from the XML document
   * @param xml instance of the XML document to convert
   */
  xmlToObject: function(xml)
  {
    this._super(xml);
    this.areaCode = xml.xmns::areaCode;
    this.countryCodeOverride = xml.xmns::countryCodeOverride;
    this.extension = xml.xmns::extension;
    this.number = xml.xmns::number;
  }
  
});
