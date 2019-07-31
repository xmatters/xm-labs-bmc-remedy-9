/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.BaseClass = function(){};
 
  // Create a new Class that inherits from this class
  BaseClass.extend = function(prop) {
    var _super = this.prototype;
   
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;
   
    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;
           
            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];
           
            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);       
            this._super = tmp;
           
            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    // The dummy class constructor
    function BaseClass() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }
   
    // Populate our constructed prototype object
    BaseClass.prototype = prototype;
   
    // Enforce the constructor to be what we expect
    BaseClass.constructor = BaseClass;

    // And make this class extendable
    BaseClass.extend = arguments.callee;
    
    // Add a default toString() implementation to the class
    BaseClass.prototype.toString = function() {
      var buffer = "<object>";
      for (var attribute in this) {
        if(typeof this[attribute] == "string") { 
          buffer += "<" + attribute + ">" + this[attribute] + "</" + attribute + ">";
        }
        else if(typeof this[attribute] == "boolean") {
          buffer += "<" + attribute + ">" + this[attribute] + "</" + attribute + ">";
        }
        else if(this[attribute] == "null") {
          buffer += "<" + attribute + ">null</" + attribute + ">";
        }
      }
      buffer += "</object>";
      return buffer;
    };
    
    // Add a default clone() implementation to the class
    BaseClass.prototype.clone = function(copy) {
      for (var attr in this) {
        if (this.hasOwnProperty(attr)) {
          copy[attr] = this[attr];
        }
      }
      return copy;
    };
   
    return BaseClass;
  };
})();
