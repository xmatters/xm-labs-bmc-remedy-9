importPackage(Packages.org.apache.log4j);

var Logger = BaseClass.extend({

  // Initial values
  LOG_SOURCE: "Agent Client: ",

  init : function(logSource)
  {
    if(logSource != null)
    {
      this.LOG_SOURCE = logSource;	
    }
  },

  debug : function(s) 
  {
    ServiceAPI.getLogger().debug(this.LOG_SOURCE + s);
  },

  info : function(s) 
  {
    ServiceAPI.getLogger().info(this.LOG_SOURCE + s);
  },

  warn : function(s) 
  {
    ServiceAPI.getLogger().warn(this.LOG_SOURCE + s);
  },

  error : function(s) 
  {
    ServiceAPI.getLogger().error(this.LOG_SOURCE + s);
  },
  
  isDebugEnabled : function()
  {
    return ServiceAPI.getLogger().isDebugEnabled();
  }
});
