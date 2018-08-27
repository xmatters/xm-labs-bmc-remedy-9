/******************************************************************************/
/*                 Start of Group Data Sync Object Definition                 */
/******************************************************************************/

// JavaScript Object to hold Device information for webservice calls
var xMattersGroupSync = BaseClass.extend({

	LOG_SOURCE: "xMattersGroupSync.js: ",

	INVALID_GROUP: "INVALID_GROUP",
	UNKNOWN_MEMBER: "UNKNOWN_MEMBER",
	SUPERVISOR_INVALID: "SUPERVISOR_INVALID",
	UNKNOWN_SUPERVISOR: "UNKNOWN_SUPERVISOR",
	OK: "OK",

	/**
	* Initialize the class variables
	*/
	init: function(syncList)
	{
		this.dataSyncHelper = new DataSyncHelper(syncList, "groups");
		this.log = new Logger(this.LOG_SOURCE);
	},

	/**
	* Synchronize the group with xMatters
	* @param group the current group object
	* @param isDelete true if the user is to be deleted, false otherwise
	*/
	syncGroup : function(group, isDelete)
	{
		try
		{
			var action = "Sync";
			var name = null
			if (!group.isValid())
			{
				throw this.INVALID_GROUP;
			}

			if (isDelete)
			{
				action = "Delete";
				this.log.debug("\tsyncGroup: Deleting group with name: " + group.name);
				group.remove();
			}
			else if (this.dataSyncHelper.checkIncludeExcludeList("Group", group.name))
			{
				if (group.exists())
				{
					if (!GROUP_SEED_ONLY)
					{
						action = "Update Group: ";
						name = group.name;
						this.log.debug("\tsyncGroup: Sending group update for " + group.name);
						this.handleSyncError(group.update(), group, "update");

						// check to see if the team exists
						if (group.team.exists())
						{
							// update the team
							action = "Update Team: ";
							name = group.team.teamName;
							this.log.debug("\tsyncGroup: Sending team update for group " + group.name + " and team " + name );
							group.team.update();
						}
						else
						{
							// create a new team to be used for the roster, the team will not be associated with a coverage
							action = "Add Team: ";
							name = group.team.teamName;
							this.log.debug("\tsyncGroup: Sending team add for group " + group.name + " and team " + name );
							group.team.add();
						}
					}
					else
					{
						this.log.info("Update for " + group.name + " will not be sent as GROUP_SEED_ONLY is " + GROUP_SEED_ONLY);
					}
				}
				else
				{
					if (!group.updateOnly)
					{
						action = "Add Group: ";
						name = group.name;
						this.handleSyncError(group.add(), group, "add");
						this.log.debug("Sent group add for " + group.name);

						action = "Add Team: ";
						name = group.team.teamName;
						group.team.add();
						this.log.debug("Sent team add for group " + group.name + " and team " + name);

						action = "Add Coverage: ";
						name = group.coverage.name;
						group.coverage.add();
						this.log.debug("Sent coverage add for group " + group.name + " and coverage " + name);
					}
				}
			}
		}
		catch (e)
		{
			this.log.error("Failed to synchronize " + name + ": " + e);
			failedList.add(action + name  + " failed to synchronize: " + e.toString());
		}
	},

	/**
	* Function to deal with exceptions that require additional processing to get
	* the object to sync to xMatters
	* @param response SOAP Response
	* @param group instance of the group object being synchronized
	* @param action the current action performed on the group
	*/
	handleSyncError: function(response, group, action)
	{
		if (this.UNKNOWN_SUPERVISOR.equalsIgnoreCase(response) || this.SUPERVISOR_INVALID.equalsIgnoreCase(response))
		{
			var obj = new Group();
			this.log.warn(group.name + ": SUPERVISOR_INVALID - [" + group.supervisors + "]. Retry using default supervisor [" + obj.supervisors + "]");
			group.supervisors = obj.supervisors;
			if ("add".equalsIgnoreCase(action))
			{
				return group.add();
			}
			else
			{
				return group.update();
			}
		}
		else if (!this.OK.equalsIgnoreCase(response))
		{
			throw response;
		}
		return response;
	}
});
