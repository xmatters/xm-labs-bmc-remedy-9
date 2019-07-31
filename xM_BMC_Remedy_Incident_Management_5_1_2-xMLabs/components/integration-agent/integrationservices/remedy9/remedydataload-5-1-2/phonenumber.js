/**
 * Helper class that will parse a phone number string and set the properties in the Device class to be synchronized
 * with xMatters.
 *
 */
var PHONE_NUMBER = BaseClass.extend({

    LOG_SOURCE: "phonenumber.js: ",

    /**
     * -----------------------------------------------------------------------------------------------------------------
     * Constructor
     *
     * @param endPoint - SOAP EndPoint URL
     * -----------------------------------------------------------------------------------------------------------------
     */
    init: function()
    {
        this.log = new Logger(this.LOG_SOURCE);
        this.log.debug("PHONE_NUMBER constructed.");
    },
    /**
     * -----------------------------------------------------------------------------------------------------------------
     * makeVoiceDevice
     *
     * Parse the phone number string into its component tokens and update the device provided. The device must
     * be a Voice Device or Numeric Pager Device.
     *
     *
     * NOTE: countryCodeOverride is a string value that uses the "ISO 3166-1 alpha-2" 2-letter country codes.
     *        For example, see http://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
     * -----------------------------------------------------------------------------------------------------------------
     */
    setVoicePhoneOrPager: function(user, voiceDevice, remedyPhoneNumber)
    {
        this.log.debug("Enter - setVoicePhoneOrPager");
        this.log.debug("deviceName [" + voiceDevice.deviceName + "]");

        var countryDialingCode = getNonNullValue(remedyPhoneNumber.CC);

        // If the Remedy phone information includes a country code, map it to the over ride code for xMatters
        if (!isEmpty(countryDialingCode))
        {
            var isoCode = this.isoCountryCodeFor(countryDialingCode);

            if (!isEmpty(isoCode))
            {
                voiceDevice.countryCodeOverride = isoCode;
            }
            else
            {
                // The helper function couldn't find a match for the country code. Record a warning.
                var msg = user.targetName + "|" + voiceDevice.deviceName + ": no match found for countryDialingCode [" + countryDialingCode + "]";
                this.log.warn("setVoicePhoneOrPager - " + msg);
                warningList.add(msg);
            }
        }
        else
        {
            voiceDevice.countryCodeOverride = "";
        }

        voiceDevice.areaCode = String(getNonNullValue(remedyPhoneNumber.Area));
        voiceDevice.number = String(getNonNullValue(remedyPhoneNumber.Local));
        voiceDevice.extension = String(getNonNullValue(remedyPhoneNumber.Extension));

        voiceDevice.isDelete = isEmpty(voiceDevice.countryCodeOverride) && isEmpty(voiceDevice.areaCode) && isEmpty(voiceDevice.number) && isEmpty(voiceDevice.extension);

        this.log.debug("makeVoiceDevice - result " + voiceDevice);
        this.log.debug("Exit - setVoicePhoneOrPager");

        return voiceDevice;
    },

    /**
     * -------------------------------------------------------------------------------------------------------------
     * isoCountryCodeFor
     *
     * @param prefix - the international dialing prefix for the country
     *
     * Returns the ISO 3166-2 2-character country code for the first country in the list in countrycodes.js
     * whose international dialing prefix is provided.
     *
     * Returns:
     *
     * - the first matching country if one or more matches are found
     * - an empty string if the prefix supplied is itself empty or no match is found
     * -------------------------------------------------------------------------------------------------------------
     */
    isoCountryCodeFor: function(prefix)
    {
        this.log.debug("Enter - isoCountryCodeFor");
        this.log.debug("isoCountryCodeFor - prefix [" + prefix + "]");

        var countryCode = "";

        if (!isEmpty(prefix))
        {
            // Get the ISO code for the first country in the XML list that has the specified dialing prefix.
            var countryMatches = countryCodes.country.(dialingPrefix == String(prefix));

            if (!isEmpty(countryMatches))
            {
                countryCode = countryMatches[0].ISO_3166_1;
            }
            else
            {
                this.log.info("No match for country with dialing prefix [" + prefix + "]")
            }
        }

        this.log.debug("countryCode [" + countryCode + "]");
        this.log.debug("Exit - isoCountryCodeFor");

        return String(countryCode);
    },

});

