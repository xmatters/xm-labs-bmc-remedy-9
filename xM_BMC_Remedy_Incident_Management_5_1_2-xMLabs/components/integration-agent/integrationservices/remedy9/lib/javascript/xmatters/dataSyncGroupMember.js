/******************************************************************************/
/*                Start of Data Sync Group Member Object Definition           */
/******************************************************************************/
var GroupMember = xMattersWS.extend({

  LOG_SOURCE: "dataSyncGroupMember.js: ",

  /**
   * Initialize the class variables
   */
  init: function()
  {
    this._super();    
    this.delay = 0;
    this.inRotation = false;
    this.targetName = "";
    this.type = "PERSON";
  },
  
  /**
   * Compares the current instance with the passed in instance for equality
   * @param other GroupMember to compare
   * @return true if the objects are equal, false otherwise
   */
  equals: function(other)
  {
    return (this.delay.toString().equals(other.delay) 
        && this.inRotation.toString().equals(other.inRotation)
        && this.targetName.toString().equals(other.targetName));
  },

  /**
   * Returns a XML String representation of the Object
   * @return XML formatted String
   */
  toString: function()
  {
    return "<GroupMember>" + 
           "<delay>" + this.delay + "</delay>" +
           "<inRotation>" + this.inRotation + "</inRotation>" +
           "<targetName>" + this.targetName + "</targetName>" +
           "<type>" + this.type + "</type>" +
           "</GroupMember>";
  }
});
