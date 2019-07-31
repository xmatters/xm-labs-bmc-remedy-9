/**
 * ---------------------------------------------------------------------------------------------------------------------
 * buildXmattersGroupName
 *
 * The name of the associated group in xMatters is based on several fields in the Remedy Support Group descriptiong
 *
 * ---------------------------------------------------------------------------------------------------------------------
 */
function buildXmattersGroupName(company, organization, groupName)
{
    log.debug("Enter - buildXmattersGroupName");
    // The group name in xMatters in a concatenation of the Remedy  company, support organization and support group,
    // separated by this character
    var GROUP_NAME_DELIMITER_TOKEN = "*";
    return company + GROUP_NAME_DELIMITER_TOKEN + organization + GROUP_NAME_DELIMITER_TOKEN + groupName;
}

/**
 * Function to return a generic javascript object with a toString() method
 * implementation to contain the results from webservice calls in a useable form
 */
function newRemedyObject()
{
    var RemedyObject = BaseClass.extend();
    return new RemedyObject();
}

/**
 * Returns empty string for null or undefined attribute
 * @param attribute value to check
 * @return non-null value
 */
function getNonNullValue(attribute)
{
    if (typeof attribute == "undefined" || attribute == null)
    {
        return "";
    }
    return attribute;
}
