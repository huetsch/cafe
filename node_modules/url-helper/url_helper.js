(function() {
  var TagHelper, UrlHelper, url_helper,
    __slice = Array.prototype.slice;

  TagHelper = require('tag-helper');

  UrlHelper = (function() {

    function UrlHelper() {}

    UrlHelper.prototype.url_for = function(options) {
      if (typeof options === 'string') {
        return options;
      } else if (options.url && typeof options.url === 'function') {
        return options.url();
      }
    };

    UrlHelper.prototype.link_to = function() {
      var args, href, href_attr, html_options, name, options, tag_options, url;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      name = args[0];
      options = args[1] || {};
      html_options = args[2] || {};
      url = this.url_for(options);
      href = html_options['href'];
      tag_options = TagHelper.tag_options(html_options) || '';
      if (!href) href_attr = "href=\"" + (TagHelper.html_escape(url)) + "\"";
      return "<a " + href_attr + tag_options + ">" + (TagHelper.html_escape(name || url)) + "</a>";
    };

    return UrlHelper;

  })();

  url_helper = new UrlHelper();

  exports.link_to = url_helper.link_to;

  exports.url_for = url_helper.url_for;

}).call(this);
