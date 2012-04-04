(function() {
  var DateHelper, DateTimeSelector, InstanceTag, TagHelper;

  DateTimeSelector = require('./datetime_selector');

  TagHelper = require('tag-helper');

  InstanceTag = require('instance-tag');

  DateHelper = (function() {

    function DateHelper() {}

    DateHelper.prototype.date_select = function(object_name, method, options, html_options) {
      var tag;
      if (options == null) options = {};
      if (html_options == null) html_options = {};
      delete options.object;
      tag = new InstanceTag(object_name, method, this, options);
      return tag.to_date_select_tag(options, html_options);
    };

    DateHelper.prototype.time_select = function(object_name, method, options, html_options) {
      if (options == null) options = {};
      if (html_options == null) html_options = {};
      delete options.object;
      return (new InstanceTag(object_name, method, this, options)).to_time_select_tag(options, html_options);
    };

    DateHelper.prototype.datetime_select = function(object_name, method, options, html_options) {
      if (options == null) options = {};
      if (html_options == null) html_options = {};
      delete options.object;
      return (new InstanceTag(object_name, method, this, options)).to_datetime_select_tag(options, html_options);
    };

    DateHelper.prototype.select_datetime = function(datetime, options, html_options) {
      if (datetime == null) datetime = new Date();
      if (options == null) options = {};
      if (html_options == null) html_options = {};
      return (new DateTimeSelector(datetime, options, html_options)).select_datetime();
    };

    DateHelper.prototype.select_date = function(date, options, html_options) {
      if (date == null) date = new Date();
      if (options == null) options = {};
      if (html_options == null) html_options = {};
      return (new DateTimeSelector(date, options, html_options)).select_date();
    };

    DateHelper.prototype.select_time = function(datetime, options, html_options) {
      if (datetime == null) datetime = Time.current;
      if (options == null) options = {};
      if (html_options == null) html_options = {};
      return (new DateTimeSelector(datetime, options, html_options)).select_time();
    };

    DateHelper.prototype.select_second = function(datetime, options, html_options) {
      if (options == null) options = {};
      if (html_options == null) html_options = {};
      return (new DateTimeSelector(datetime, options, html_options)).select_second();
    };

    DateHelper.prototype.select_minute = function(datetime, options, html_options) {
      if (options == null) options = {};
      if (html_options == null) html_options = {};
      return (new DateTimeSelector(datetime, options, html_options)).select_minute();
    };

    DateHelper.prototype.select_hour = function(datetime, options, html_options) {
      if (options == null) options = {};
      if (html_options == null) html_options = {};
      return (new DateTimeSelector(datetime, options, html_options)).select_hour();
    };

    DateHelper.prototype.select_day = function(date, options, html_options) {
      if (options == null) options = {};
      if (html_options == null) html_options = {};
      return (new DateTimeSelector(date, options, html_options)).select_day();
    };

    DateHelper.prototype.select_month = function(date, options, html_options) {
      if (options == null) options = {};
      if (html_options == null) html_options = {};
      return (new DateTimeSelector(date, options, html_options)).select_month();
    };

    DateHelper.prototype.select_year = function(date, options, html_options) {
      if (options == null) options = {};
      if (html_options == null) html_options = {};
      return (new DateTimeSelector(date, options, html_options)).select_year();
    };

    return DateHelper;

  })();

  InstanceTag.prototype.to_date_select_tag = function(options, html_options) {
    if (options == null) options = {};
    if (html_options == null) html_options = {};
    return this.datetime_selector(options, html_options).select_date().html_safe().valueOf();
  };

  InstanceTag.prototype.to_time_select_tag = function(options, html_options) {
    if (options == null) options = {};
    if (html_options == null) html_options = {};
    return this.datetime_selector(options, html_options).select_time().html_safe().valueOf();
  };

  InstanceTag.prototype.to_datetime_select_tag = function(options, html_options) {
    if (options == null) options = {};
    if (html_options == null) html_options = {};
    return this.datetime_selector(options, html_options).select_datetime().html_safe().valueOf();
  };

  InstanceTag.prototype.datetime_selector = function(options, html_options) {
    var datetime, _base, _name;
    datetime = (typeof (_base = this.object)[_name = this.method_name] === "function" ? _base[_name]() : void 0) || this.default_datetime(options);
    this.auto_index || (this.auto_index = null);
    options = Object.clone(options);
    options.field_name = this.method_name;
    options.include_position = true;
    options.prefix || (options.prefix = this.object_name);
    if (this.auto_index && !(options.index != null)) {
      options.index = this.auto_index;
    }
    return new DateTimeSelector(datetime, options, html_options);
  };

  InstanceTag.prototype.default_datetime = function(options) {
    var default_options, key, time, _i, _len, _ref;
    if (!(options.include_blank || options.prompt)) {
      if (!options["default"]) {
        return new Date();
      } else if (options["default"] instanceof Date) {
        return options["default"];
      } else {
        default_options = Object.clone(options["default"]);
        default_options.min || (default_options.min = default_options.minute);
        default_options.sec || (default_options.sec = default_options.second);
        time = new Date();
        _ref = ['month', 'hours', 'minutes', 'seconds'];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          key = _ref[_i];
          default_options[key] || (default_options[key] = time["get" + (key.capitalize())]());
        }
        default_options.fullYear || (default_options.fullYear = time["getFullYear"]());
        default_options.day || (default_options.day = time["getDate"]());
        return new Date(default_options.fullYear, default_options.month, default_options.day, default_options.hours, default_options.minutes, default_options.seconds);
      }
    }
  };

  module.exports = new DateHelper();

}).call(this);
