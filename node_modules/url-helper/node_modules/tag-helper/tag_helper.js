(function() {
  var TagHelper, helper,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  require('cream');

  String.prototype.html_safe = function() {
    this.is_html_safe = 1;
    return this;
  };

  TagHelper = (function() {

    function TagHelper() {}

    TagHelper.prototype.HTML_ESCAPE = {
      '&': '&amp;',
      '>': '&gt;',
      '<': '&lt;',
      '"': '&quot;'
    };

    TagHelper.prototype.JSON_ESCAPE = {
      '&': '\u0026',
      '>': '\u003E',
      '<': '\u003C'
    };

    TagHelper.prototype.BOOLEAN_ATTRIBUTES = ['disabled', 'readonly', 'multiple', 'checked', 'autobuffer', 'autoplay', 'controls', 'loop', 'selected', 'hidden', 'scoped', 'async', 'defer', 'reversed', 'ismap', 'seemless', 'muted', 'required', 'autofocus', 'novalidate', 'formnovalidate', 'open', 'pubdate'];

    TagHelper.prototype.html_escape = function(s) {
      if (!(s instanceof String)) s = String(s);
      if (s.is_html_safe == null) {
        return s.replace(/&/g, "&amp;").replace(/\"/g, "&quot;").replace(/>/g, "&gt;").replace(/</g, "&lt;").html_safe();
      } else {
        return s;
      }
    };

    TagHelper.prototype.tag = function(name, options, open, escape) {
      var tag_options;
      if (options == null) options = null;
      if (open == null) open = false;
      if (escape == null) escape = true;
      tag_options = '';
      if (options) tag_options = this.tag_options(options, escape);
      return ("<" + name + tag_options + (open ? '>' : ' />')).html_safe();
    };

    TagHelper.prototype.content_tag = function(name, content_or_options_with_block, options, escape) {
      if (content_or_options_with_block == null) {
        content_or_options_with_block = null;
      }
      if (options == null) options = null;
      if (escape == null) escape = true;
      return this.content_tag_string(name, content_or_options_with_block, options, escape);
    };

    TagHelper.prototype.content_tag_string = function(name, content, options, escape) {
      var tag_options;
      if (escape == null) escape = true;
      tag_options = options ? this.tag_options(options, escape) : '';
      return ("<" + name + tag_options + ">" + (escape ? this.html_escape(content) : content) + "</" + name + ">").html_safe();
    };

    TagHelper.prototype.tag_options = function(options, escape) {
      var attrs, final_value, k, key, keys, v, value;
      if (escape == null) escape = true;
      keys = (function() {
        var _results;
        _results = [];
        for (k in options) {
          v = options[k];
          _results.push(k);
        }
        return _results;
      })();
      if (keys.length !== 0) {
        attrs = [];
        for (key in options) {
          value = options[key];
          if (key === 'data' && typeof value === 'object') {
            for (k in value) {
              v = value[k];
              if (typeof v !== 'string') v = JSON.stringify(v);
              if (escape) v = this.html_escape(v);
              attrs.push("data-" + (k.dasherize()) + "=\"" + v + "\"");
            }
          } else if (__indexOf.call(this.BOOLEAN_ATTRIBUTES, key) >= 0) {
            if (value) attrs.push("" + key + "=\"" + key + "\"");
          } else if (value !== null && value !== void 0) {
            final_value = value;
            if (value instanceof Array) final_value = value.join(" ");
            if (escape) final_value = this.html_escape(final_value);
            attrs.push("" + key + "=\"" + final_value + "\"");
          }
        }
        if (attrs.length !== 0) {
          return (" " + (attrs.sort().join(' '))).html_safe();
        }
      }
    };

    return TagHelper;

  })();

  helper = new TagHelper();

  exports.html_escape = helper.html_escape;

  exports.tag = helper.tag;

  exports.content_tag = helper.content_tag_string;

  exports.tag_options = helper.tag_options;

  exports.BOOLEAN_ATTRIBUTES = helper.BOOLEAN_ATTRIBUTES;

  exports.HTML_ESCAPE = helper.HTML_ESCAPE;

  exports.JSON_ESCAPE = helper.JSON_ESCAPE;

}).call(this);
