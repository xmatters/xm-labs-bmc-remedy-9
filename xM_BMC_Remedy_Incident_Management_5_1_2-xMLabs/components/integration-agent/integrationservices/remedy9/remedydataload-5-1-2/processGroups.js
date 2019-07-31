/**
 * ---------------------------------------------------------------------------------------------------------------------
 * processRemedySupportGroups
 *
 * Update or delete in xMatters a support group and group association / membership data from Remedy.
 * Group list information is retrieved in chunks whose size is configurable, in order not to retrieve
 * hundreds or user records in one Web service invocation.
 *
 * The delete action needs to be handled by this function because its necessary to retrieve the group information
 * from Remedy to determine the name of the group.
 *
 * Depending on the qualification this may process a single group or multiple groups.
 *
 * ---------------------------------------------------------------------------------------------------------------------
 */
function processRemedySupportGroups(qualification, isDelete, isUpdateOnly, requestType, additionalData)
{
    log.debug("Enter - processRemedySupportGroups");

    log.info("processRemedySupportGroups - isDelete [" + isDelete + "], qualification [" + qualification + "], chunkSize [" + XM_CTM_WS_CHUNK_SIZE + "], isUpdateOnly [" + isUpdateOnly + "]");

    var supportGroupListWS = new XM_CTM_SUPPORT_GROUP_WS(new WSUtil(), XM_CTM_SUPPORT_GROUP_WS_URL);
    var supportGroupList = null;
    var startRecord = 0;

    var userDataSyncHelper = new DataSyncHelper(syncList, "users");

    // Retrieve the support group list from Remedy in chunks until we get a null response.

    while ((supportGroupList = supportGroupListWS.getSupportGroupList(qualification, startRecord, XM_CTM_WS_CHUNK_SIZE)) != null)
    {
        // Get the list of nodes that contain the group descriptions
        log.debug("supportGroupList length [" + supportGroupList.length + "]");

        for each (var supportGroup in supportGroupList)
        {
            var supportGroupId = supportGroup.Support_Group_ID;

            log.debug("startRecord [" + startRecord + "], Remedy Support Group ID [" + supportGroupId + "]");

            tryProcessOneRemedySupportGroup(supportGroup, userDataSyncHelper, isDelete, isUpdateOnly, requestType, additionalData);
            startRecord++;
        }
    }

    log.debug("Exit - processRemedySupportGroups");
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * isQualifyingGroup
 *
 * Determine whether the group identified meets the qualifications for batch updates.
 * ---------------------------------------------------------------------------------------------------------------------
 */
function isQualifyingGroup(groupId)
{
    log.debug("Enter - isQualifyingGroup");
    log.debug("isQualifyingGroup: groupId [" + groupId + "]");

    var result = false;

    // Build a Remedy qualification that uses both the ID of this person and the batch processing criteria
    var qualification = XM_CTM_SUPPORT_GROUP_WS_GROUP_QUALIFICATION.replace("${GROUP_ID}", String(groupId))
        + " AND ( "
        + XM_CTM_SUPPORT_GROUP_WS_BATCH_QUALIFICATION
        + " )";

    log.debug("isQualifyingGroup: qualification [" + qualification + "]");

    var groupListWS = new XM_CTM_SUPPORT_GROUP_WS(new WSUtil(), XM_CTM_SUPPORT_GROUP_WS_URL);

    var groupList = groupListWS.getSupportGroupList(qualification, 0, XM_CTM_WS_CHUNK_SIZE);

    if (groupList == null)
    {
        log.debug("isQualifyingGroup: group does not match batch selection criteria");
    }
    else
    {
        if (groupList.length == 1)
        {
            result = true;
            log.debug("isQualifyingGroup: group matches batch selection criteria");
        }
        else
        {
            log.warn("isQualifyingGroup: groupList contains more than one entry");
        }
    }

    log.debug("isQualifyingGroup: result [" + result + "]");
    log.debug("Exit - isQualifyingGroup");

    return result;
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * tryProcessOneRemedySupportGroup
 *
 * Add/update or delete a single Remedy support group in xMatters. If anything goes wrong at this level, record it in the
 * failure list, but continue processing
 * ---------------------------------------------------------------------------------------------------------------------
 */
function tryProcessOneRemedySupportGroup(remedySupportGroup, userDataSyncHelper, isDelete, isUpdateOnly, requestType, additionalData)
{
    log.debug("Enter - tryProcessOneRemedySupportGroup");
    var group = null;

    try
    {
      if (isDelete)
      {
          group = makeGroupForDelete(remedySupportGroup);
      }
      else
      {
        // Get the list of users who are members of this support group
        var supportGroupId = remedySupportGroup.Support_Group_ID;
        var supportGroupMemberList =
            (new XM_CTM_SUPPORT_GROUP_ASSOC_WS(new WSUtil(), XM_CTM_SUPPORT_GROUP_ASSOC_WS_URL)).getGroupMemberList(supportGroupId);

        group = makeGroupForAddUpdate(remedySupportGroup, supportGroupMemberList, userDataSyncHelper, isUpdateOnly);
        
        var queryGroup = group.query();

        // Check to see if a group member was deleted.
        // If the member was deleted we need to retrieve all the teams within xMatters that the member
        // belongs to and remove this user from the team 
        if (REMOVE_USERS_FROM_ALL_TEAMS_IN_GROUP) 
        {
          if (requestType != null && requestType.equals(REQUEST_DELETE_GROUP) && additionalData != null && additionalData !="") 
          {
            var deletedUser = additionalData;
            var resGroup = queryGroup.xmns::QueryGroupResponse.child(QName(xmns, "return")).xmns::group;
            
            var teamsUserBelongsTo;
            for each (var team in resGroup.xmns::teams.xmns::team)
            {
              for each (var member in team.xmns::members.xmns::member)
              {
                // if the member is found we need to create a new Team without the deleted member and 
                // make a call to update xMatters
                if (deletedUser.equals(member.xmns::name.toString())) {
                  log.debug("Team member " + deletedUser + " to be deleted as the team member exists in xMatters team " + team.xmns::name);
                  
                  var teamToUpdate = createTeamToUpdateWithoutMember(team, resGroup.xmns::name.toString(), deletedUser);
                  
                  log.debug("Updating team " + team.xmns::name + " in xMatters to remove the group member " + deletedUser + " removed from Remedy");
                  teamToUpdate.update();
                }
              }            
            }
          }
        }
      }
      
      // syncGroup will do a delete if the 2nd argument is true
      (new xMattersGroupSync(syncList)).syncGroup(group, isDelete);

      log.info("Finished processing for Remedy group " + remedySupportGroup.Support_Group_ID);
    }
    catch (e)
    {
        var groupName = buildXmattersGroupName(remedySupportGroup.Company, remedySupportGroup.Support_Organization, remedySupportGroup.Support_Group_Name);
        log.warn("tryProcessOneRemedySupportGroup - while processing user Remedy Login ID [" + groupName + "] got exception [" + e.toString() + "]");
        failedList.add((isDelete ? "Delete" : "Add/Update") + " Group: " + groupName + " failed to synchronize: " + e.toString());
    }

    log.debug("Exit - tryProcessOneRemedySupportGroup");
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * createTeamToUpdateWithoutMember
 *
 * Creates a xMatters Team based off the current xMatters team without the userToRemove.
 * ---------------------------------------------------------------------------------------------------------------------
 */
function createTeamToUpdateWithoutMember(team, groupName, userToRemove) 
{

  log.debug("enter - createTeamToUpdate for team " + team.toString());
  var newTeam = new Team();
  newTeam.groupName = groupName;
  newTeam.teamName = team.xmns::name.toString();
  newTeam.teamDescription = team.xmns::description.toString();
  newTeam.externallyOwned = team.xmns::externallyOwned.toString();
  newTeam.reuse = team.xmns::reuse.toString();
  newTeam.name = team.xmns::name.toString();
  newTeam.type = team.xmns::type.toString();
  newTeam.rotationInterval = team.xmns::rotationInterval.toString();
  newTeam.rotationStart = team.xmns::rotationStart.toString();
  newTeam.rotationUnit = team.xmns::rotationUnit.toString();
  newTeam.teamExists = true;
  
  var orderedMembers = new LinkedHashMap();
  for each (var member in team.xmns::members.xmns::member)
  {
    if (!userToRemove.equals(member.xmns::name.toString()))
    {
      var tempMember = new GroupMember();
      tempMember.targetName = member.xmns::name.toString();
      tempMember.delay = member.xmns::delay.toString();
      tempMember.inRotation = member.xmns::inRotation.toString();
      tempMember.type = member.xmns::type.toString();
      
      orderedMembers.put(tempMember.targetName, tempMember);
    }
  }
  newTeam.members.clear();
  newTeam.members = orderedMembers;
  
  log.debug("exit - createTeamToUpdate");
  
  return newTeam;
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * makeGroupForDelete
 *
 * Delete a single group from xMatters, using the group description from Remedy.
 * ---------------------------------------------------------------------------------------------------------------------
 */
function makeGroupForDelete(remedySupportGroup)
{
    log.debug("Enter - makeGroupForDelete");

    var group = new Group(buildXmattersGroupName(remedySupportGroup.Company, remedySupportGroup.Support_Organization, remedySupportGroup.Support_Group_Name));

    log.info("Deleting group from xMatters [" + group.name + "]");
    log.debug("Exit - makeGroupForDelete");
    return group;
}

/**
 * ---------------------------------------------------------------------------------------------------------------------
 * makeGroupForAddUpdate
 *
 * Load a single Remedy support group and its associated team / membership information.
 *
 * ---------------------------------------------------------------------------------------------------------------------
 */
function makeGroupForAddUpdate(remedySupportGroup, supportGroupMemberList, userDataSyncHelper, isUpdateOnly)
{
    log.debug("Enter - makeGroupForAddUpdate");
    log.info("Starting data load for Remedy Support Group " + remedySupportGroup.Support_Group_ID + ", isUpdateOnly [" + isUpdateOnly + "]");

    log.debug("remedySupportGroup: " + remedySupportGroup);
    log.debug("supportGroupMemberList: " + supportGroupMemberList);

    var group = new Group(buildXmattersGroupName(remedySupportGroup.Company, remedySupportGroup.Support_Organization, remedySupportGroup.Support_Group_Name));

    group.updateOnly = isUpdateOnly;

    // Some group properties are not derived from Remedy information. These are only given initial values when the group
    // is created. After that, the values in xMatters are preserved during updates.
    if (!group.groupExists)
    {
        group.externallyOwned = EXTERNALLY_OWN_GROUPS;
        group.site = DEFAULT_USER_SITE;

        // The default supervisor is defined in configuration.js and depends on whether xMatters has
        // merged administrator accounts or not.
        group.supervisors = (new SupervisorMapper()).getSupervisorsForGroup(group);
    }

    // The remainder of the user properties are based on Remedy information at the time of the update

    group.active = remedySupportGroup.Status == "Enabled";
    group.description = remedySupportGroup.Description;

    group.coverage.groupName = group.name;
    group.team.groupName = group.name;
    group.team.externallyOwned = group.externallyOwned;

    if (supportGroupMemberList != null && supportGroupMemberList.length > 0)
    {
        for each (var remedyGroupMember in supportGroupMemberList)
        {
            var userLoginId = remedyGroupMember.Login_ID;
            log.debug("userLoginId [" + userLoginId + "]");

            if (userDataSyncHelper.checkIncludeExcludeList("user", userLoginId))
            {
                syncGroupMember = new GroupMember();
                syncGroupMember.targetName = userLoginId;
                group.team.members.put(userLoginId, syncGroupMember);
            }
        }
    }

    log.debug("About to sync Group: " + group);
    log.debug("Exit - makeGroupForAddUpdate");

    return group;
}


