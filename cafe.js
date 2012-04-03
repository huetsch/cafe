(function() {
  var DateHelper, UrlHelper, k, root, v;

  DateHelper = require('date-helper');

  UrlHelper = require('url-helper');

  root = typeof window !== "undefined" && window !== null ? window : global;

  for (k in DateHelper) {
    v = DateHelper[k];
    root[k] = v;
  }

  for (k in UrlHelper) {
    v = UrlHelper[k];
    root[k] = v;
  }

}).call(this);
