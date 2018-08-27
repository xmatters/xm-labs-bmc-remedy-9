/**
 * Helper class that will map the Remedy roles a user has to a list of xMatters roles. Each Remedy role can have
 * zero or one associated xMatters role
 *
 */
var UserRolesMapper = BaseClass.extend({

    LOG_SOURCE: "userRolesMapper.js: ",

    /**
     * -----------------------------------------------------------------------------------------------------------------
     * Constructor
     *
     * -----------------------------------------------------------------------------------------------------------------
     */
    init: function()
    {
        this.log = new Logger(this.LOG_SOURCE);
        this.log.debug("UserRolesMapper constructed.");
    },

    /**
     * -----------------------------------------------------------------------------------------------------------------
     * getXmUserRolesFor
     *
     * Returns a list of the xMatters roles corresponding to the Remedy support group roles that the user has.
     *
     * -----------------------------------------------------------------------------------------------------------------
     */
    getXmUserRolesFor: function(remedyRolesList)
    {
        this.log.debug("Enter - getXmUserRolesFor");
        this.log.debug("remedyRolesList [" + remedyRolesList + "]");

        var xmUsersRolesList = DEFAULT_XMATTERS_ROLES.slice(0);

        if (!MAP_REMEDY_USER_ROLES)
        {
            this.log.debug("MAP_REMEDY_USER_ROLES is false");
        }
        else if (remedyRolesList == null)
        {
            this.log.debug("No getListValues found");
        }
        else
        {
            this.log.debug("remedyRolesList length [" + remedyRolesList.length + "]");

            for each (var remedyRoleItem in remedyRolesList)
            {
                this.log.debug("remedyRole [" + remedyRoleItem + "]");

                var remedyFunctionalRole = String(remedyRoleItem.Functional_Role);
                var mappedRoles = roleMap[remedyFunctionalRole];
                
                if (!isEmpty(mappedRoles))
                {
                  xmUsersRolesList = xmUsersRolesList.concat(mappedRoles);
                }
                this.log.debug("XM Roles: " + xmUsersRolesList);
            }
        }
        this.log.debug("xmUsersRolesList " + "[" + xmUsersRolesList + "]");

        this.log.debug("Exit - getXmUserRolesFor");

        return xmUsersRolesList;
    }

});

