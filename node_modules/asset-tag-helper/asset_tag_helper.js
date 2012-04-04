(function() {
  var AssetTagHelper, TagHelper, basename, helper;

  require('cream');

  TagHelper = require('tag-helper');

  basename = function(path, suffix) {
    var name;
    if (suffix == null) suffix = null;
    name = path.split('/').last();
    if (suffix) {
      return name.replace(new RegExp("" + (suffix.replace(/\./g, "\\.").replace(/\*/g, '.*')) + "$"), '');
    } else {
      return name;
    }
  };

  AssetTagHelper = (function() {

    function AssetTagHelper() {}

    AssetTagHelper.prototype.image_path = function(source) {
      return "/images/" + source;
    };

    AssetTagHelper.prototype.path_to_image = function(source) {
      return this.image_path(source);
    };

    AssetTagHelper.prototype.image_tag = function(source, options) {
      var mouseover, size, src, _ref;
      if (options == null) options = {};
      src = options.src = this.path_to_image(source);
      if (!(src != null ? src.match(/^cid:/) : void 0)) {
        options.alt || (options.alt = this.image_alt(src));
      }
      if (size = Object["delete"](options, 'size')) {
        if (size.match(/^\d+x\d+$/)) {
          _ref = size.split('x'), options.width = _ref[0], options.height = _ref[1];
        }
      }
      if (mouseover = Object["delete"](options, 'mouseover')) {
        options.onmouseover = "this.src='" + (this.path_to_image(mouseover)) + "'";
        options.onmouseout = "this.src='" + src + "'";
      }
      return TagHelper.tag('img', options);
    };

    AssetTagHelper.prototype.image_alt = function(src) {
      return basename(src, '.*').capitalize();
    };

    return AssetTagHelper;

  })();

  helper = new AssetTagHelper();

  exports.image_path = helper.image_path;

  exports.path_to_image = helper.path_to_image;

  exports.image_tag = helper.image_tag;

  exports.image_alt = helper.image_alt;

}).call(this);
