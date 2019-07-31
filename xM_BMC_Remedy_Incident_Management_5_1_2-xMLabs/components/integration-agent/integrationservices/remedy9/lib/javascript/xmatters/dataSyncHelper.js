/******************************************************************************/
/*                Start of Data Sync Helper Object Definition                 */
/******************************************************************************/

// JavaScript Object to provide include/exclude functionality for data sync
var DataSyncHelper = BaseClass.extend({

  LOG_SOURCE: "dataSyncHelper.js: ",

  init: function(syncList, nodeName)
  {
    this.log = new Logger(this.LOG_SOURCE);
    this.syncList = syncList.child(nodeName);
  },
  
   /**
    * Checks the include exclude list to see if we are performing a include or exclude.
    * If we are performing a exclude we check to see that the user does not exist in the list.
    * If we are performing a include we check to make sure they are in the list.
    * @param type String for logging what type of object is being checked
    * @param name target name of the object that is being checked
    */
  checkIncludeExcludeList : function(type, name) 
  {
    var found = false;

    // List is not used as it does not hold any values
    if (this.syncActionExclude() && this.syncList == null) 
    {
      this.log.debug(type + ": " + name + " will be synchronized as " + name + " is not on the exclude list");
      return true;
    } 

    // Retrieve the nodes for the include/exclude type
    if ("user".equalsIgnoreCase(type))
    {
      found = this.syncList.user.contains(name.toString());
    }
    else if ("group".equalsIgnoreCase(type))
    {
      found = this.syncList.group.contains(name.toString());
    }
    this.log.debug(name + (found ? " found" : " not found") + " in the " + type + " list.")

    if (this.syncActionExclude() && !found) 
    {
      this.log.debug(type + ": " + name + " will be synchronized as " + name + " is not on the exclude list");
      return true;
    } 
    else if (!this.syncActionExclude() && found) 
    {
      this.log.debug(type + ": " + name + " will be synchronized as " + name + " is on the include list");
      return true;
    }

    if (this.syncActionExclude()) 
    {
      this.log.info(type + ": " + name + " will not be synchronized as " + name + " is on the exclude list");
    } 
    else 
    {
      this.log.info(type + ": " + name + " will not be synchronized as " + name + " is not on the include list");
    }
    return false;
  },
  
  /**
   * Identifies what the sync action is
   * @return true if SYNC_ACTION is exclude, false otherwise
   */
  syncActionExclude: function()
  {
    return SYNC_ACTION.equalsIgnoreCase("exclude");
  }
});
