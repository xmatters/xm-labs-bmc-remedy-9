/**
 * ---------------------------------------------------------------------------------------------------------------------
 * processRemedyUsers
 *
 * Load all the User and device information from Remedy to xMatters. User information is retrieved in chunks whose
 * size is configurable, in order not to retrieve hundreds of user records in one Web service invocation.
 *
 * The number of users actually processed is determined by the qualification string, which may select an individual
 * user or an entire batch.
 * ---------------------------------------------------------------------------------------------------------------------
 */
function processRemedyUsers(qualification, isDelete, isUpdateOnly)
{
    log.debug("Enter - processRemedyUsers");

    log.info("processRemedyUsers. isDelete [" + isDelete + "], qualification [" + qualification + "], chunkSize [" + XM_CTM_WS_CHUNK_SIZE + "], isUpdateOnly [" + isUpdateOnly + "]");

    var peopleListWS = new XM_CTM_PEOPLE_WS(new WSUtil(), XM_CTM_PEOPLE_WS_URL);
    var peopleList = null;
    var startRecord = 0;

    // Retrieve the user list from Remedy in chunks until we get a null response.
    while ((peopleList = peopleListWS.getPeopleList(qualification, startRecord, XM_CTM_WS_CHUNK_SIZE)) != null)
    {
        // Get the list of nodes that contain the user descriptions
        log.debug("peopleList length [" + peopleList.length + "]");

        for each (var person in peopleList)
        {
            log.debug("startRecord [" + startRecord + "], Remedy Login ID [" + person.Remedy_Login_ID + "]");

            // determine if user should be deleted if their status is Delete in Remedy
            if (person.Profile_Status == "Delete") {
              tryProcessOneRemedyUser(person, true, isUpdateOnly);
            } else {
              tryProcessOneRemedyUser(person, isDelete, isUpdateOnly);
            }
            startRecord++;
        }
    }

    log.debug("Exit - processRemedyUsers");
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * isQualifyingUser
 *
 * Determine whether the user identified meets the qualifications for batch updates.
 * ---------------------------------------------------------------------------------------------------------------------
 */
function isQualifyingUser(personId)
{
    log.debug("Enter - isQualifyingUser");
    log.debug("isQualifyingUser: personId [" + personId + "]");

    var result = false;

    // Build a Remedy qualification that uses both the ID of this person and the batch processing criteria
    var qualification = XM_CTM_PEOPLE_WS_PERSON_QUALIFICATION.replace("${PERSON_ID}", String(personId))
        + " AND ( "
        + XM_CTM_PEOPLE_WS_BATCH_QUALIFICATION
        + " )";

    log.debug("isQualifyingUser: qualification [" + qualification + "]");

    var peopleListWS = new XM_CTM_PEOPLE_WS(new WSUtil(), XM_CTM_PEOPLE_WS_URL);

    var peopleList = peopleListWS.getPeopleList(qualification, 0, XM_CTM_WS_CHUNK_SIZE);

    if (peopleList == null)
    {
        log.debug("isQualifyingUser: person does not match batch selection criteria");
    }
    else
    {
        if (peopleList.length == 1)
        {
            result = true;
            log.debug("isQualifyingUser: person matches batch selection criteria");
        }
        else
        {
            log.warn("isQualifyingUser: peopleList contains more than one entry");
        }
    }

    log.debug("isQualifyingUser: result [" + result + "]");
    log.debug("Exit - isQualifyingUser");

    return result;
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * tryProcessOneRemedyUser
 *
 * Add/update or delete a single Remedy user in xMatters. If anything goes wrong at this level, record it in the
 * failure list, but continue processing
 * ---------------------------------------------------------------------------------------------------------------------
 */
function tryProcessOneRemedyUser(person, isDelete, isUpdateOnly)
{
    log.debug("Enter - tryProcessOneRemedyUser");
    var user = null;

    try
    {
        if (isDelete)
        {
            user = new User(person.Remedy_Login_ID);
        }
        else
        {
            // Get the list of Remedy roles associated with this person
            var remedyLoginId = person.Remedy_Login_ID;
            var remedyRolesList =
                (new XM_CTM_SUPPORT_GROUP_FUNCTIONAL_ROLE_WS(new WSUtil(), XM_CTM_SUPPORT_GROUP_FUNCTIONAL_ROLE_WS_URL)).getGroupRoleList(remedyLoginId);

            user = makeUserForAddUpdate(person, remedyRolesList, isUpdateOnly);
        }

        (new xMattersUserSync(syncList)).syncUser(user, isDelete);

        log.info("Finished processing for Remedy user " + person.Remedy_Login_ID);
    }
    catch (e)
    {
        var userName = person.Remedy_Login_ID;
        log.warn("tryProcessOneRemedyUser - while processing user Remedy Login ID [" + userName + "] got exception [" + e.toString() + "]");
        failedList.add((isDelete ? "Delete" : "Add/Update") + " User: " + userName + " failed to synchronize: " + e.toString());
    }

    log.debug("Exit - tryProcessOneRemedyUser");

    return user;
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * makeUserForAddUpdate
 *
 * Prepare a single user object describing the Remedy person to be transferred to xMatters.
 * ---------------------------------------------------------------------------------------------------------------------
 */
function makeUserForAddUpdate(remedyPerson, remedyRolesList, isUpdateOnly)
{
    log.debug("Enter - makeUserForAddUpdate");
    log.debug("Starting data load for Remedy user " + remedyPerson.Remedy_Login_ID + ", isUpdateOnly [" + isUpdateOnly + "]");

    log.debug("makeUserForAddUpdate Person [" + remedyPerson.toString() + "]");

    var user = new User(remedyPerson.Remedy_Login_ID);

    log.debug("xMatters User [" + user.toString() + "]");

    user.updateOnly = isUpdateOnly;

    // Some user properties are not derived from Remedy information. These are only given initial values when the user
    // is created. After that, the values in xMatters are preserved during updates.
    if (!user.userExists)
    {
        user.externallyOwned = EXTERNALLY_OWN_USERS;
        user.webLoginType = WEB_LOGIN_TYPE;
        user.ldapDomain = WEB_LOGIN_LDAP_DOMAIN;
        user.site = DEFAULT_USER_SITE;
        user.language = DEFAULT_LANGUAGE;
        user.hasMobileAccess = DEFAULT_MOBILE_ACCESS;
        user.timeZone = DEFAULT_TIME_ZONE;

        // The default supervisor is defined in configuration.js and depends on whether xMatters has
        // merged administrator accounts or not.
        user.supervisors = (new SupervisorMapper()).getSupervisorsForUser(user);
    }

    // Only set the roles array value:
    // IF the user exists and MAP_REMEDY_USER_ROLES = true OR the user is being added.
    // Otherwise, xMatters will be treated as the master source.
    if (!user.userExists || MAP_REMEDY_USER_ROLES)
    {
        user.roles = (new UserRolesMapper()).getXmUserRolesFor(remedyRolesList);
    }

    // Update user status
    // Users with status 'Enabled' in Remedy will be set to 'Active' in xMatters
    // Users with status 'Proposed', 'Offline', 'Obsolete' & 'Archive'  in Remedy will be set to 'In-active' in xMatters
    if (remedyPerson.Profile_Status == "Enabled") 
    {
      user.active = "Active";
    } else if ((remedyPerson.Profile_Status == "Proposed" ) || (remedyPerson.Profile_Status == "Offline" ) || (remedyPerson.Profile_Status == "Obsolete" ) || (remedyPerson.Profile_Status == "Archive" ))
    {
      user.active = "In-active";  
    }
    
    log.debug("Remedy Profile_Status = " + remedyPerson.Profile_Status + " which will set the xMatters user Status to " + user.active);

    // The remainder of the user properties are based on Remedy information at the time of the update
    user.active = remedyPerson.Profile_Status == "Enabled";
    user.firstName = remedyPerson.First_Name;
    user.lastName = remedyPerson.Last_Name;
    user.webLogin = remedyPerson.Remedy_Login_ID;

    // See if the Remedy person information contains any device information and
    // add each device found to the user's devices list.

    // If the device description returned by Remedy is empty, use the isDelete property to flag the device for
    // deletion in xMatters. Do it below for email devices, but leave it to setVoicePhoneOrPager() otherwise.

    var remedyDeviceInfo = null;
    var syncDevice = null;
    var phoneNumberHelper = new PHONE_NUMBER();

    remedyDeviceInfo = remedyPerson.Internet_Email
    log.debug("Found Internet_Email device [" + remedyDeviceInfo + "]");

    syncDevice = new EmailDevice(user.targetName, DEVICE_NAME_EMAIL, PROVIDER_NAME_EMAIL);
    syncDevice.isDelete = isEmpty(remedyDeviceInfo);
    syncDevice.address = String(remedyDeviceInfo);
    syncDevice.externallyOwned = user.externallyOwned;
    user.devices.add(syncDevice);

    remedyDeviceInfo = remedyPerson.Phone_Number_Business;
    syncDevice = phoneNumberHelper.setVoicePhoneOrPager(user, new VoiceDevice(user.targetName, DEVICE_NAME_PHONE_NUMBER_BUSINESS, PROVIDER_NAME_VOICE), remedyDeviceInfo);
    syncDevice.externallyOwned = user.externallyOwned;
    user.devices.add(syncDevice);

    remedyDeviceInfo = remedyPerson.Phone_Number_Mobile;
    syncDevice = phoneNumberHelper.setVoicePhoneOrPager(user, new VoiceDevice(user.targetName, DEVICE_NAME_PHONE_NUMBER_MOBILE, PROVIDER_NAME_VOICE), remedyDeviceInfo);
    syncDevice.externallyOwned = user.externallyOwned;
    user.devices.add(syncDevice);

    remedyDeviceInfo = remedyPerson.Phone_Number_Home;
    syncDevice = phoneNumberHelper.setVoicePhoneOrPager(user, new VoiceDevice(user.targetName, DEVICE_NAME_PHONE_NUMBER_HOME, PROVIDER_NAME_VOICE), remedyDeviceInfo);
    syncDevice.externallyOwned = user.externallyOwned;
    user.devices.add(syncDevice);

    remedyDeviceInfo = remedyPerson.Phone_Number_Fax;
    syncDevice = phoneNumberHelper.setVoicePhoneOrPager(user, new VoiceDevice(user.targetName, DEVICE_NAME_PHONE_NUMBER_FAX, PROVIDER_NAME_VOICE), remedyDeviceInfo);
    syncDevice.externallyOwned = user.externallyOwned;
    user.devices.add(syncDevice);

    log.debug("User to sync is: " + user.toString());
    log.debug("Exit - makeUserForAddUpdate");

    return user;
}

