(function() {
  var ArgumentError, InstanceTag,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  require('cream');

  ArgumentError = (function(_super) {

    __extends(ArgumentError, _super);

    function ArgumentError() {
      ArgumentError.__super__.constructor.apply(this, arguments);
    }

    return ArgumentError;

  })(Error);

  InstanceTag = (function() {

    function InstanceTag(object_name, method_name, template_object, object) {
      var regex, str, _ref;
      if (object == null) object = null;
      _ref = [Object.clone(String(object_name).valueOf()), Object.clone(String(method_name).valueOf())], this.object_name = _ref[0], this.method_name = _ref[1];
      this.template_object = template_object;
      regex = /\[\]$/;
      if (regex.test(this.object_name)) {
        this.object_name = this.object_name.replace(regex, '');
      } else {
        regex = /\[\]\]$/;
        if (regex.test(this.object_name)) {
          this.object_name = this.object_name.replace(regex, ']');
        } else {
          regex = null;
        }
      }
      this.object = this.retrieve_object(object);
      if (regex) {
        str = regex.exec(this.object_name);
        this.auto_index = this.retrieve_autoindex(this.object_name.slice(0, this.object_name.indexOf(str)));
      }
    }

    InstanceTag.prototype.retrieve_object = function(object) {
      if (object) {
        return object;
      } else if (this.template_object["" + this.object_name] != null) {
        return this.template_object["" + this.object_name];
      }
    };

    InstanceTag.prototype.retrieve_autoindex = function(pre_match) {
      var object;
      object = this.object || this.template_object["" + pre_match];
      if (object) {
        return JSON.stringify(object);
      } else {
        throw new ArgumentError("object[] naming but object param and @object var don't exist or don't respond to to_param: " + object.inspect);
      }
    };

    return InstanceTag;

  })();

  module.exports = InstanceTag;

}).call(this);
