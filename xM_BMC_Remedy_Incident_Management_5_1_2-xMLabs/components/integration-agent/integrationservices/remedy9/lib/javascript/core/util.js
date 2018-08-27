/**
 * Javascript utility functions
 *
 */

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * isEmpty
 *
 * Checks if the given string value is undefined, null or an empty string
 *
 * @param value parameter to check
 * @return true if the value is empty, false otherwise
 * ---------------------------------------------------------------------------------------------------------------------
 */
function isEmpty(value)
{
    var result;

    if (typeof value == "undefined" || value == null || value == "")
    {
        result = true;
    }
    else
    {
        result = false;
    }

    return result;
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * equalsIgnoreCase
 *
 * Case-insensitive comparison of 2 strings. If either argument is null or undefined the result is false.
 *
 * @param string1
 * @param string2
 * ---------------------------------------------------------------------------------------------------------------------
 */
function equalsIgnoreCase(string1, string2)
{
    if (string1 != null && typeof string1 != "undefined" && string2 != null && typeof string2 != "undefined")
    {
        return string1.toUpperCase() == string2.toUpperCase();
    }
    return false;
}

/**
 * Used to format the responseTokens.get("responseEvent") so its not all upper case and unformatted 
 * ex: "SUCCESSFUL_DELIVERY" is changed to Successful Delivery
 */

String.prototype.toProperCase = function(){
    return String(this).toLowerCase().replace("_", " ").replace(/(^[a-z]| [a-z])/g, 
        function($1){
            return $1.toUpperCase();
        }
    );
};