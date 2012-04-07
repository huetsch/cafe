(function() {
  var AssetTagHelper, DateHelper, FormOptionsHelper, FormTagHelper, UrlHelper, k, root, v;

  DateHelper = require('date-helper');

  UrlHelper = require('url-helper');

  AssetTagHelper = require('asset-tag-helper');

  FormOptionsHelper = require('form-options-helper');

  FormTagHelper = require('form-tag-helper');

  root = typeof window !== "undefined" && window !== null ? window : global;

  for (k in DateHelper) {
    v = DateHelper[k];
    root[k] = v;
  }

  for (k in UrlHelper) {
    v = UrlHelper[k];
    root[k] = v;
  }

  for (k in AssetTagHelper) {
    v = AssetTagHelper[k];
    root[k] = v;
  }

  for (k in FormOptionsHelper) {
    v = FormOptionsHelper[k];
    root[k] = v;
  }

  for (k in FormTagHelper) {
    v = FormTagHelper[k];
    root[k] = v;
  }

}).call(this);
