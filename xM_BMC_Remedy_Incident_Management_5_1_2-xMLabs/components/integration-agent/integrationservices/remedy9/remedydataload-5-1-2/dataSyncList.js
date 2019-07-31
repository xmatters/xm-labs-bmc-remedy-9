/**
 * ---------------------------------------------------------------------------------------------------------------------
 * This is the include/exclude list for data sync.
 *
 * To include users in the the synchronization, add the users to the XML and set the SYNC_ACTION parameter to include.
 *
 * To exclude users in the the synchronization, add the users to the XML and set the SYNC_ACTION parameter to exclude.
 *
 * SYNC_ACTION of exclude with an empty user list will result in ALL users being synchronized to xMatters
 *
 * SYNC_ACTION of include with an empty user list will result in NO users being synchronized to xMatters
 *
 *
 * To include groups in the the synchronization, add the groups to the XML and set the SYNC_ACTION parameter to include.
 *
 * To exclude groups in the the synchronization, add the groups to the XML and set the SYNC_ACTION parameter to exclude.
 *
 * SYNC_ACTION of exclude with an empty group list will result in ALL groups being synchronized to xMatters
 *
 * SYNC_ACTION of exclude with an empty group list will result in NO groups being synchronized to xMatters
 * ---------------------------------------------------------------------------------------------------------------------
 */


var SYNC_ACTION = "exclude";

// Set USER_SEED_ONLY to true if users should only be added and not updated in xMatters
// from the synchronization process
var USER_SEED_ONLY = false;

// Set GROUP_SEED_ONLY to true if groups should only be added and not updated in xMatters
// from the synchronization process
var GROUP_SEED_ONLY = false;

var syncList = new XML();
syncList = <synclist>
             <users>
               <user>admin</user>
             </users>
             <groups>
               <group>Operations</group>
             </groups>
           </synclist>;

