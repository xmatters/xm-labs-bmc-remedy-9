/******************************************************************************/
/*                 Start of User Data Sync Object Definition                  */
/******************************************************************************/

// JavaScript Object to hold Device information for webservice calls
var xMattersUserSync = BaseClass.extend({

	LOG_SOURCE: "xMattersUserSync.js: ",

	INVALID_USER: "INVALID_USER",
	INVALID_DEVICE: "INVALID_DEVICE",
	SUPERVISOR_INVALID: "SUPERVISOR_INVALID",
	UNKNOWN_SUPERVISOR: "UNKNOWN_SUPERVISOR",
	OK: "OK",

	/**
	* Initialize the class variables
	*/
	init: function(syncList)
	{
	this.dataSyncHelper = new DataSyncHelper(syncList, "users");
	this.log = new Logger(this.LOG_SOURCE);
	},

	/**
	* Synchronize the user with xMatters
	* @param user the current user object
	* @param isDelete true if the user is to be deleted, false otherwise
	*/
	syncUser : function(user, isDelete)
	{
	try
	{
		var action = "Sync";
		if (!user.isValid())
		{
			throw this.INVALID_USER;
		}

		if (isDelete)
		{
			action = "Delete";
			this.log.debug("Sending user delete for " + user.targetName);
			user.remove();
		}
		else if (this.dataSyncHelper.checkIncludeExcludeList("User", user.targetName))
		{
			if (user.exists())
			{
				if (!USER_SEED_ONLY)
				{
					action = "Update";
					this.log.debug("Sending user update for " + user.targetName);
					this.handleSyncError(user.update(), user, "update");

					// Sync the devices
					this.syncDevices(user.targetName, user.devices);
				}
				else
				{
					this.log.info("Update for " + user.targetName + " will not be sent as USER_SEED_ONLY is " + USER_SEED_ONLY);
				}
			}
			else
			{
				if (!user.updateOnly)
				{
					action = "Add";
					this.log.debug("Sending user add for " + user.targetName);
					this.handleSyncError(user.add(), user, "add");

					// Sync the devices
					this.syncDevices(user.targetName, user.devices);
				}
			}
		}
	}
	catch (e)
	{
		this.log.error("Failed to synchronize " + user.targetName + ": " + e);
		failedList.add(action + " User: " + user.targetName  + " failed to synchronize: " + e.toString());
	}
	},

	/**
	* Synchronize the user devices with xMatters
	* @param owner user that owns this device
	* @param devices collection of devices belonging to the current user
	*/
	syncDevices: function(owner, devices)
	{
		for (var i=0; i<devices.size(); i++)
		{
			var action = "Sync";
			try
			{
				var device = devices.get(i);
				device.owner = owner;

				if (device.exists())
				{
					if (!device.isDelete)
					{
						action = "Update";
						this.log.debug("\tSending device update for " + device.deviceName);
						device.update();
					}
					else
					{
						action = "Delete";
						this.log.debug("\tSending device delete for " + device.deviceName);
						device.remove();
					}
				}
				else if (!device.isDelete)
				{
					action = "Add";
					this.log.debug("\tSending device add for " + device.deviceName);
					device.add();
				}
			}
			catch (e)
			{
				this.log.error("Failed to synchronize " + device.deviceName + " for " + device.owner + ": " + e);
				failedList.add(action + " " + device.deviceType + " Device: " + device.owner + "|" + device.deviceName  + " failed to synchronize: " + e.toString());
			}
		}
	},

	/**
	* Function to deal with exceptions that require additional processing to get
	* the object to sync to xMatters
	* @param response SOAP Response
	* @param user instance of the user object being synchronized
	* @param action the current action performed on the user
	*/
	handleSyncError: function(response, user, action)
	{
		if (this.UNKNOWN_SUPERVISOR.equalsIgnoreCase(response) || this.SUPERVISOR_INVALID.equalsIgnoreCase(response))
		{
			var obj = new User();
			this.log.warn(user.targetName + ": SUPERVISOR_INVALID - [" + user.supervisors + "]. Retry using default supervisor [" + obj.supervisors + "]");
			user.supervisors = obj.supervisors;
			if ("add".equalsIgnoreCase(action))
			{
				return user.add();
			}
			else
			{
				return user.update();
			}
		}
		else if (!this.OK.equalsIgnoreCase(response))
		{
		  throw response;
		}
	}
});