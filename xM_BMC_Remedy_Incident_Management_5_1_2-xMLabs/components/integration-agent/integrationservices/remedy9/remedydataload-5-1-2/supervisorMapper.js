/**
 * =====================================================================================================================
 * Helper class for the determination of the supervisors of users and groups.
 *
 * NOTE:
 *
 * Currently this code only uses static values from configuration settings, but could be modified to use information
 * from Remedy.
 *
 * =====================================================================================================================
 */
var SupervisorMapper = BaseClass.extend({

    LOG_SOURCE: "SupervisorMapper.js: ",

    /**
     * -----------------------------------------------------------------------------------------------------------------
     * Constructor
     *
     * -----------------------------------------------------------------------------------------------------------------
     */
    init: function()
    {
        this.log = new Logger(this.LOG_SOURCE);
        this.log.debug("SupervisorMapper constructed.");
    },

    /**
     * -----------------------------------------------------------------------------------------------------------------
     * getSupervisorsForUser
     *
     * -----------------------------------------------------------------------------------------------------------------
     */
    getSupervisorsForUser: function(user)
    {
        this.log.debug("Enter - getSupervisorsForUser");


        this.log.debug("Exit - getSupervisorsForUser");
        return DEFAULT_SUPERVISOR;
    },

        /**
     * -----------------------------------------------------------------------------------------------------------------
     * getSupervisorsForGroup
     *
     * -----------------------------------------------------------------------------------------------------------------
     */
    getSupervisorsForGroup: function(group)
    {
        this.log.debug("Enter - getSupervisorsForGroup");


        this.log.debug("Exit - getSupervisorsForGroup");
        return DEFAULT_SUPERVISOR;
    }

});

