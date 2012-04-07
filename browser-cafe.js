var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;
    
    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = (function () {
    var queue = [];
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;
    
    if (canPost) {
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);
    }
    
    return function (fn) {
        if (canPost) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        }
        else setTimeout(fn, 0);
    };
})();

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

if (!process.env) process.env = {};
if (!process.argv) process.argv = [];

require.define("path", function (require, module, exports, __dirname, __filename) {
function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("/node_modules/date-helper/package.json", function (require, module, exports, __dirname, __filename) {
module.exports = {"main":"./date_helper.js"}
});

require.define("/node_modules/date-helper/date_helper.js", function (require, module, exports, __dirname, __filename) {
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

});

require.define("/node_modules/date-helper/datetime_selector.js", function (require, module, exports, __dirname, __filename) {
(function() {
  var DateTimeSelector, TagHelper,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  require('cream');

  TagHelper = require('tag-helper');

  DateTimeSelector = (function() {

    function DateTimeSelector(datetime, options, html_options) {
      if (options == null) options = {};
      if (html_options == null) html_options = {};
      this.options = Object.clone(options);
      this.html_options = Object.clone(html_options);
      if (datetime instanceof Date) {
        this.datetime = datetime;
      } else if (datetime) {
        this.datetime = new Date(new String(datetime));
      }
      if (this.options.datetime_separator == null) {
        this.options.datetime_separator = ' &mdash; ';
      }
      if (this.options.time_separator == null) this.options.time_separator = ' : ';
      this.sec = function() {
        var _ref;
        return (_ref = this.datetime) != null ? _ref.getSeconds() : void 0;
      };
      this.min = function() {
        var _ref;
        return (_ref = this.datetime) != null ? _ref.getMinutes() : void 0;
      };
      this.hour = function() {
        var _ref;
        return (_ref = this.datetime) != null ? _ref.getHours() : void 0;
      };
      this.day = function() {
        var _ref;
        return (_ref = this.datetime) != null ? _ref.getDate() : void 0;
      };
      this.month = function() {
        if (this.datetime) return (this.datetime.getMonth() % 12) + 1;
      };
      this.year = function() {
        var _ref;
        return (_ref = this.datetime) != null ? _ref.getFullYear() : void 0;
      };
    }

    DateTimeSelector.prototype.date_order = function() {
      return this.options.order || ['year', 'month', 'day'] || [];
    };

    DateTimeSelector.prototype.select_datetime = function() {
      var o, order, _base, _base2, _base3, _base4, _base5, _i, _len, _ref;
      order = Object.clone(this.date_order());
      order = order.filter(function(x) {
        return x !== 'hour' && x !== 'minute' && x !== 'second';
      });
      (_base = this.options).discard_year || (_base.discard_year = __indexOf.call(order, 'year') < 0 ? true : void 0);
      (_base2 = this.options).discard_month || (_base2.discard_month = __indexOf.call(order, 'month') < 0 ? true : void 0);
      (_base3 = this.options).discard_day || (_base3.discard_day = this.options.discard_month || (__indexOf.call(order, 'day') < 0) ? true : void 0);
      (_base4 = this.options).discard_minute || (_base4.discard_minute = this.options.discard_hour ? true : void 0);
      (_base5 = this.options).discard_second || (_base5.discard_second = !(this.options.include_seconds && (!this.options.discard_minute)) ? true : void 0);
      if (this.datetime && this.options.discard_day && !this.options.discard_month) {
        this.datetime.setDate(1);
      }
      if (this.options.tag && this.options.ignore_date) {
        return this.select_time();
      } else {
        _ref = ['day', 'month', 'year'];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          o = _ref[_i];
          if (__indexOf.call(order, o) < 0) order.unshift(o);
        }
        if (!this.options.discard_hour) {
          order = order.concat(['hour', 'minute', 'second']);
        }
        return (this.build_selects_from_types(order)).valueOf();
      }
    };

    DateTimeSelector.prototype.select_date = function() {
      var o, order, ret, _base, _base2, _base3, _i, _len, _ref;
      order = Object.clone(this.date_order());
      this.options.discard_hour = true;
      this.options.discard_minute = true;
      this.options.discard_second = true;
      (_base = this.options).discard_year || (_base.discard_year = (__indexOf.call(order, 'year') < 0 ? true : void 0));
      (_base2 = this.options).discard_month || (_base2.discard_month = (__indexOf.call(order, 'month') < 0 ? true : void 0));
      (_base3 = this.options).discard_day || (_base3.discard_day = this.options.discard_month || __indexOf.call(order, 'day') < 0 ? true : void 0);
      if (this.datetime && this.options.discard_day && !this.options.discard_month) {
        this.datetime.setDate(1);
      }
      _ref = ['day', 'month', 'year'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        o = _ref[_i];
        if (__indexOf.call(order, o) < 0) order.unshift(o);
      }
      ret = (this.build_selects_from_types(order)).valueOf();
      return ret;
    };

    DateTimeSelector.prototype.select_time = function() {
      var order, _base;
      order = [];
      this.options.discard_month = true;
      this.options.discard_year = true;
      this.options.discard_day = true;
      (_base = this.options).discard_second || (_base.discard_second = !this.options.include_seconds ? true : void 0);
      if (!this.options.ignore_date) {
        order = order.concat(['year', 'month', 'day']);
      }
      order = order.concat(['hour', 'minute']);
      if (this.options.include_seconds) order.push('second');
      return this.build_selects_from_types(order);
    };

    DateTimeSelector.prototype.select_second = function() {
      if (this.options.use_hidden || this.options.discard_second) {
        if (this.options.include_seconds) {
          return this.build_hidden('second', this.sec());
        } else {
          return '';
        }
      } else {
        return this.build_options_and_select('second', this.sec());
      }
    };

    DateTimeSelector.prototype.select_minute = function() {
      if (this.options.use_hidden || this.options.discard_minute) {
        return this.build_hidden('minute', this.min());
      } else {
        return this.build_options_and_select('minute', this.min(), {
          step: this.options.minute_step
        });
      }
    };

    DateTimeSelector.prototype.select_hour = function() {
      if (this.options.use_hidden || this.options.discard_hour) {
        return this.build_hidden('hour', this.hour());
      } else {
        return this.build_options_and_select('hour', this.hour(), {
          end: 23,
          ampm: this.options.ampm
        });
      }
    };

    DateTimeSelector.prototype.select_day = function() {
      if (this.options.use_hidden || this.options.discard_day) {
        return this.build_hidden('day', this.day());
      } else {
        return this.build_options_and_select('day', this.day(), {
          start: 1,
          end: 31,
          leading_zeros: false
        });
      }
    };

    DateTimeSelector.prototype.select_month = function() {
      var month_number, month_options, options;
      if (this.options.use_hidden || this.options.discard_month) {
        return this.build_hidden('month', this.month());
      } else {
        month_options = [];
        for (month_number = 1; month_number <= 12; month_number++) {
          options = {
            value: month_number
          };
          if (this.month() === month_number) options.selected = "selected";
          month_options.push(TagHelper.content_tag('option', this.month_name(month_number), options) + "\n");
        }
        return this.build_select('month', month_options.join(''));
      }
    };

    DateTimeSelector.prototype.select_year = function() {
      var middle_year, options, val;
      if ((!this.datetime) || this.datetime === 0) {
        val = '';
        middle_year = (new Date()).getFullYear();
      } else {
        val = middle_year = this.year();
      }
      if (this.options.use_hidden || this.options.discard_year) {
        return this.build_hidden('year', val);
      } else {
        options = {};
        options.start = this.options.start_year || (middle_year - 5);
        options.end = this.options.end_year || (middle_year + 5);
        options.step = options.start < options.end ? 1 : -1;
        options.leading_zeros = false;
        return this.build_options_and_select('year', val, options);
      }
    };

    DateTimeSelector.prototype.build_selects_from_types = function(order) {
      var new_select, select, separator, type, _i, _len, _ref;
      select = '';
      _ref = Object.clone(order).reverse();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        type = _ref[_i];
        if (type === order.first()) {
          separator = '';
        } else {
          separator = this.separator(type);
        }
        new_select = this["select_" + type]();
        select = "" + separator + new_select + select;
      }
      return select.html_safe();
    };

    DateTimeSelector.prototype.separator = function(type) {
      var ret;
      ret = (function() {
        switch (type) {
          case 'year':
            if (this.options.discard_year) {
              return '';
            } else {
              return this.options.date_separator;
            }
            break;
          case 'month':
            if (this.options.discard_month) {
              return '';
            } else {
              return this.options.date_separator;
            }
            break;
          case 'day':
            if (this.options.discard_day) {
              return '';
            } else {
              return this.options.date_separator;
            }
            break;
          case 'hour':
            if (this.options.discard_year && this.options.discard_day) {
              return '';
            } else {
              return this.options.datetime_separator;
            }
            break;
          case 'minute':
            if (this.options.discard_minute) {
              return '';
            } else {
              return this.options.time_separator;
            }
            break;
          case 'second':
            if (this.options.include_seconds) {
              return this.options.time_separator;
            } else {
              return '';
            }
        }
      }).call(this);
      return ret || (ret = '');
    };

    DateTimeSelector.prototype.month_names = function() {
      var month_names;
      month_names = this.options.use_month_names || this.translated_month_names();
      if (month_names.length < 13) month_names.unshift(null);
      return month_names;
    };

    DateTimeSelector.prototype.month_name = function(number) {
      if (this.options.use_month_numbers) {
        return number;
      } else if (this.options.add_month_numbers) {
        return "" + number + " - " + (this.month_names()[number]);
      } else {
        return this.month_names()[number];
      }
    };

    DateTimeSelector.prototype.translated_month_names = function() {
      if (this.options.use_short_month) {
        return [null, "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      } else {
        return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      }
    };

    DateTimeSelector.prototype.build_options_and_select = function(type, selected, options) {
      if (options == null) options = {};
      return this.build_select(type, this.build_options(selected, options));
    };

    DateTimeSelector.prototype.AMPM_TRANSLATION = {
      0: "12 AM",
      1: "01 AM",
      2: "02 AM",
      3: "03 AM",
      4: "04 AM",
      5: "05 AM",
      6: "06 AM",
      7: "07 AM",
      8: "08 AM",
      9: "09 AM",
      10: "10 AM",
      11: "11 AM",
      12: "12 PM",
      13: "01 PM",
      14: "02 PM",
      15: "03 PM",
      16: "04 PM",
      17: "05 PM",
      18: "06 PM",
      19: "07 PM",
      20: "08 PM",
      21: "09 PM",
      22: "10 PM",
      23: "11 PM"
    };

    DateTimeSelector.prototype.DEFAULT_PREFIX = 'date';

    DateTimeSelector.prototype.POSITION = {
      year: 1,
      month: 2,
      day: 3,
      hour: 4,
      minute: 5,
      second: 6
    };

    DateTimeSelector.prototype.build_options = function(selected, options) {
      var i, leading_zeros, select_options, start, step, stop, tag_options, text, value;
      if (options == null) options = {};
      start = 0;
      if (options.start) {
        start = options.start;
        delete options.start;
      }
      stop = 59;
      if (options.end) {
        stop = options.end;
        delete options.end;
      }
      step = 1;
      if (options.step) {
        step = options.step;
        delete options.step;
      }
      if (options.leading_zeros == null) options.leading_zeros = true;
      leading_zeros = options.leading_zeros;
      delete options.leading_zeros;
      if (options.ampm == null) options.ampm = false;
      select_options = [];
      for (i = start; start <= stop ? i <= stop : i >= stop; i += step) {
        value = String(i);
        if (leading_zeros) {
          if (value.length === 1) {
            value = "0" + value;
          } else if (value.length === 0) {
            value = "00";
          }
        }
        tag_options = {
          value: value
        };
        if (selected === i) tag_options.selected = "selected";
        text = options.ampm ? this.AMPM_TRANSLATION[i] : value;
        select_options.push(TagHelper.content_tag('option', text, tag_options));
      }
      return (select_options.join("\n") + "\n").html_safe();
    };

    DateTimeSelector.prototype.build_select = function(type, select_options_as_html) {
      var k, select_html, select_options, v, _ref;
      select_options = {
        id: this.input_id_from_type(type),
        name: this.input_name_from_type(type)
      };
      _ref = this.html_options;
      for (k in _ref) {
        v = _ref[k];
        select_options[k] = v;
      }
      if (this.options.disabled) select_options.disabled = 'disabled';
      select_html = "\n";
      if (this.options.include_blank) {
        select_html += TagHelper.content_tag('option', '', {
          value: ''
        }) + "\n";
      }
      if (this.options.prompt) {
        select_html += this.prompt_option_tag(type, this.options.prompt) + "\n";
      }
      select_html += select_options_as_html;
      return (TagHelper.content_tag('select', select_html.html_safe(), select_options) + "\n").html_safe();
    };

    DateTimeSelector.prototype.build_hidden = function(type, value) {
      var html_options;
      html_options = {
        type: 'hidden',
        id: this.input_id_from_type(type),
        name: this.input_name_from_type(type),
        value: value
      };
      if (this.html_options.disabled) html_options = this.html_options.disabled;
      return (TagHelper.tag('input', html_options) + "\n").html_safe();
    };

    DateTimeSelector.prototype.input_name_from_type = function(type) {
      var field_name, k, prefix, v;
      prefix = this.options.prefix || this.DEFAULT_PREFIX;
      if (__indexOf.call((function() {
        var _ref, _results;
        _ref = this.options;
        _results = [];
        for (k in _ref) {
          v = _ref[k];
          _results.push(k);
        }
        return _results;
      }).call(this), 'index') >= 0) {
        prefix += "[" + this.options.index + "]";
      }
      field_name = this.options.field_name || type;
      if (this.options.include_position) {
        field_name += "(" + this.POSITION[type] + "i)";
      }
      if (this.options.discard_type) {
        return prefix;
      } else {
        return "" + prefix + "[" + field_name + "]";
      }
    };

    DateTimeSelector.prototype.input_id_from_type = function(type) {
      return this.input_name_from_type(type).replace(/([\[\(])|(\]\[)/g, '_').replace(/[\]\)]/g, '');
    };

    return DateTimeSelector;

  })();

  module.exports = DateTimeSelector;

}).call(this);

});

require.define("/node_modules/cream/package.json", function (require, module, exports, __dirname, __filename) {
module.exports = {"main":"./cream.js"}
});

require.define("/node_modules/cream/cream.js", function (require, module, exports, __dirname, __filename) {
(function() {
  var blues_strftime,
    __hasProp = Object.prototype.hasOwnProperty,
    __slice = Array.prototype.slice;

  Object["delete"] = function(obj, k) {
    var v;
    v = obj[k];
    delete obj[k];
    return v;
  };

  Object.clone = function(obj) {
    var key, newInstance;
    if (!(obj != null) || typeof obj !== 'object') return obj;
    newInstance = new obj.constructor();
    for (key in obj) {
      newInstance[key] = Object.clone(obj[key]);
    }
    return newInstance;
  };

  Object.merge = function(o1, o2) {
    var k, v;
    o1 = Object.clone(o1);
    for (k in o2) {
      if (!__hasProp.call(o2, k)) continue;
      v = o2[k];
      o1[k] = v;
    }
    return o1;
  };

  Object.update = function(o1, o2) {
    var k, v;
    for (k in o2) {
      if (!__hasProp.call(o2, k)) continue;
      v = o2[k];
      o1[k] = v;
    }
    return o1;
  };

  Object.toArray = function(obj) {
    var k, v, _results;
    _results = [];
    for (k in obj) {
      if (!__hasProp.call(obj, k)) continue;
      v = obj[k];
      _results.push([k, v]);
    }
    return _results;
  };

  Object.isPlainObject = function(obj) {
    return (obj && (typeof obj === 'object') && (Object.getPrototypeOf(obj) === Object.prototype) && (Object.prototype.toString.call(obj) === {}.toString())) || false;
  };

  Array.wrap = function(obj) {
    if (obj instanceof Array) {
      return obj;
    } else if (obj === null || obj === void 0) {
      return [];
    } else {
      return [obj];
    }
  };

  Array.prototype.sum = function() {
    if (this.length > 0) {
      return this.reduce(function(x, y) {
        return x + y;
      });
    } else {
      return 0;
    }
  };

  Array.prototype.first = function() {
    if (this.length > 0) {
      return this[0];
    } else {
      return;
    }
  };

  Array.prototype.last = function() {
    if (this.length > 0) return this[this.length - 1];
  };

  Array.prototype.butLast = function() {
    if (this.length > 0) return this.slice(0, -1);
  };

  Array.prototype.max = function() {
    return Math.max.apply(Math, this);
  };

  Array.prototype.min = function() {
    return Math.min.apply(Math, this);
  };

  Array.prototype.zip = function() {
    var arr, arrs, group, i, max_len, ret, _i, _len;
    arrs = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    arrs = [Object.clone(this)].concat(arrs);
    max_len = arrs.map(function(arr) {
      return arr.length;
    }).max();
    ret = [];
    for (i = 0; 0 <= max_len ? i < max_len : i > max_len; 0 <= max_len ? i++ : i--) {
      group = [];
      for (_i = 0, _len = arrs.length; _i < _len; _i++) {
        arr = arrs[_i];
        group.push(arr[i]);
      }
      ret.push(group);
    }
    return ret;
  };

  Array.prototype.flatten = function() {
    return this.reduce((function(xs, el) {
      if (Array.isArray(el)) {
        return xs.concat(el.flatten());
      } else {
        return xs.concat([el]);
      }
    }), []);
  };

  Array.prototype.select = Array.prototype.filter;

  Array.prototype.reject = function(fn) {
    return this.select(function(x) {
      return !fn(x);
    });
  };

  Array.prototype.extract_options = function() {
    if (Object.isPlainObject(this.last())) {
      return this.pop();
    } else {
      return {};
    }
  };

  String.prototype.capitalize = function() {
    return (this.split(' ').map(function(word) {
      return word[0].toUpperCase() + word.slice(1).toLowerCase();
    })).join(' ');
  };

  String.prototype.beginsWith = function(str) {
    if (this.match(new RegExp("^" + str))) {
      return true;
    } else {
      return false;
    }
  };

  String.prototype.endsWith = function(str) {
    if (this.match(new RegExp("" + str + "$"))) {
      return true;
    } else {
      return false;
    }
  };

  String.prototype.dasherize = function(reg) {
    if (reg == null) reg = /_/g;
    if (typeof reg === 'string') reg = new RegExp(reg, 'g');
    return this.replace(reg, '-');
  };

  String.prototype.strip = String.prototype.trim;

  String.prototype.html_safe = function() {
    this.is_html_safe = 1;
    return this;
  };

  Number.prototype.seconds = function() {
    return this * 1000;
  };

  Number.prototype.minutes = function() {
    return this.seconds() * 60;
  };

  Number.prototype.minute = Number.prototype.minutes;

  Number.prototype.hours = function() {
    return this.minutes() * 60;
  };

  Number.prototype.hour = Number.prototype.hours;

  Number.prototype.ago = function() {
    return new Date(new Date().valueOf() - this);
  };

  Number.prototype.from_now = function() {
    return new Date(new Date().valueOf() + this);
  };

  Date.COMMON_YEAR_DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  Date.is_gregorian_leap_year = function(y) {
    return y % 4 === 0 && y % 100 !== 0 || y % 400 === 0;
  };

  Date.prototype.days_in_month = function() {
    if (this.getMonth() === 1 && Date.is_gregorian_leap_year(this.getFullYear())) {
      return 29;
    } else {
      return Date.COMMON_YEAR_DAYS_IN_MONTH[this.getMonth()];
    }
  };

  Date.prototype.tomorrow = function() {
    return new Date(this.valueOf() + 24 * 60 * 60 * 1000);
  };

  Date.prototype.yesterday = function() {
    return new Date(this.valueOf() - 24 * 60 * 60 * 1000);
  };

  Date.prototype.beginning_of_day = function() {
    return new Date(new Date(this).setHours(0, 0, 0, 0));
  };

  Date.prototype.end_of_day = function() {
    return new Date(new Date(this).setHours(23, 59, 59, 999));
  };

  Date.prototype.prev_month = function() {
    var d, d2, num_days_in_prev_month;
    d = new Date(this);
    d2 = d.beginning_of_month();
    d2.setMonth(this.getMonth() - 1);
    num_days_in_prev_month = d2.days_in_month();
    if (num_days_in_prev_month < d.getDate()) d.setDate(num_days_in_prev_month);
    d.setMonth(this.getMonth() - 1);
    return d;
  };

  Date.prototype.next_month = function() {
    var d, d2, num_days_in_next_month;
    d = new Date(this);
    d2 = d.beginning_of_month();
    d2.setMonth(this.getMonth() + 1);
    num_days_in_next_month = d2.days_in_month();
    if (num_days_in_next_month < d.getDate()) d.setDate(num_days_in_next_month);
    d.setMonth(this.getMonth() + 1);
    return d;
  };

  Date.prototype.beginning_of_month = function() {
    return new Date(new Date(this).setDate(1)).beginning_of_day();
  };

  Date.prototype.end_of_month = function() {
    var last_date;
    last_date = this.days_in_month();
    return new Date(new Date(this).setDate(last_date)).end_of_day();
  };

  blues_strftime = require('prettydate').strftime;

  Date.prototype.strftime = function(str) {
    return blues_strftime(this, str);
  };

}).call(this);

});

require.define("/node_modules/cream/node_modules/prettydate/package.json", function (require, module, exports, __dirname, __filename) {
module.exports = {"main":"lib/prettydate.js"}
});

require.define("/node_modules/cream/node_modules/prettydate/lib/prettydate.js", function (require, module, exports, __dirname, __filename) {
exports.strftime = strftime = require('./strftime');


});

require.define("/node_modules/cream/node_modules/prettydate/lib/strftime.js", function (require, module, exports, __dirname, __filename) {
/**
 * strftime formatters for javascript based on the Open Group specification defined at
 * http://www.opengroup.org/onlinepubs/007908799/xsh/strftime.html
 * This implementation does not include modified conversion specifiers (i.e., Ex and Ox)
 */

/**
 * Pad a number with leading spaces, zeroes or something else
 * @method xPad
 * @param x {Number}	The number to be padded
 * @param pad {String}  The character to pad the number with
 * @param r {Number}	(optional) The base of the pad, eg, 10 implies to two digits, 100 implies to 3 digits.
 * @private
 */
function xPad(x, pad, r)
{
	if(typeof r === "undefined") {
		r=10;
	}
	pad = pad.toString();
	for( ; parseInt(x, 10)<r && r>1; r/=10) {
		x = pad + x;
	}
	return x.toString();
}

var formats = {
	a: function (d, l) { return l.a[d.getDay()]; },
	A: function (d, l) { return l.A[d.getDay()]; },
	b: function (d, l) { return l.b[d.getMonth()]; },
	B: function (d, l) { return l.B[d.getMonth()]; },
	C: function (d) { return xPad(parseInt(d.getFullYear()/100, 10), 0); },
	d: ["getDate", "0"],
	e: ["getDate", " "],
	g: function (d) { return xPad(parseInt(formats.G(d)%100, 10), 0); },
	G: function (d) {
			var y = d.getFullYear();
			var V = parseInt(formats.V(d), 10);
			var W = parseInt(formats.W(d), 10);

			if(W > V) {
				y++;
			} else if(W===0 && V>=52) {
				y--;
			}

			return y;
		},
	H: ["getHours", "0"],
	I: function (d) { var I=d.getHours()%12; return xPad(I===0?12:I, 0); },
	j: function (d) {
			var gmd_1 = new Date("" + d.getFullYear() + "/1/1 GMT");
			var gmdate = new Date("" + d.getFullYear() + "/" + (d.getMonth()+1) + "/" + d.getDate() + " GMT");
			var ms = gmdate - gmd_1;
			var doy = parseInt(ms/60000/60/24, 10)+1;
			return xPad(doy, 0, 100);
		},
	k: ["getHours", " "],
	l: function (d) { var I=d.getHours()%12; return xPad(I===0?12:I, " "); },
	m: function (d) { return xPad(d.getMonth()+1, 0); },
	M: ["getMinutes", "0"],
	p: function (d, l) { return l.p[d.getHours() >= 12 ? 1 : 0 ]; },
	P: function (d, l) { return l.P[d.getHours() >= 12 ? 1 : 0 ]; },
	s: function (d, l) { return parseInt(d.getTime()/1000, 10); },
	S: ["getSeconds", "0"],
	u: function (d) { var dow = d.getDay(); return dow===0?7:dow; },
	U: function (d) {
			var doy = parseInt(formats.j(d), 10);
			var rdow = 6-d.getDay();
			var woy = parseInt((doy+rdow)/7, 10);
			return xPad(woy, 0);
		},
	V: function (d) {
			var woy = parseInt(formats.W(d), 10);
			var dow1_1 = (new Date("" + d.getFullYear() + "/1/1")).getDay();
			// First week is 01 and not 00 as in the case of %U and %W,
			// so we add 1 to the final result except if day 1 of the year
			// is a Monday (then %W returns 01).
			// We also need to subtract 1 if the day 1 of the year is 
			// Friday-Sunday, so the resulting equation becomes:
			var idow = woy + (dow1_1 > 4 || dow1_1 <= 1 ? 0 : 1);
			if(idow === 53 && (new Date("" + d.getFullYear() + "/12/31")).getDay() < 4)
			{
				idow = 1;
			}
			else if(idow === 0)
			{
				idow = formats.V(new Date("" + (d.getFullYear()-1) + "/12/31"));
			}

			return xPad(idow, 0);
		},
	w: "getDay",
	W: function (d) {
			var doy = parseInt(formats.j(d), 10);
			var rdow = 7-formats.u(d);
			var woy = parseInt((doy+rdow)/7, 10);
			return xPad(woy, 0, 10);
		},
	y: function (d) { return xPad(d.getFullYear()%100, 0); },
	Y: "getFullYear",
	z: function (d) {
			var o = d.getTimezoneOffset();
			var H = xPad(parseInt(Math.abs(o/60), 10), 0);
			var M = xPad(Math.abs(o%60), 0);
			return (o>0?"-":"+") + H + M;
		},
	Z: function (d) {
		var tz = d.toString().replace(/^.*:\d\d( GMT[+-]\d+)? \(?([A-Za-z ]+)\)?\d*$/, "$2").replace(/[a-z ]/g, "");
		if(tz.length > 4) {
			tz = formats.z(d);
		}
		return tz;
	},
	"%": function (d) { return "%"; }
};

var aggregates = {
	c: "locale",
	D: "%m/%d/%y",
	F: "%Y-%m-%d",
	h: "%b",
	n: "\n",
	r: "%I:%M:%S %p",
	R: "%H:%M",
	t: "\t",
	T: "%H:%M:%S",
	x: "locale",
	X: "locale"
	//"+": "%a %b %e %T %Z %Y"
};

/**
 * Takes a native JavaScript Date and formats it as a string for display to user.
 *
 * @method strftime
 * @param oDate {Date} Date.
 * @param sFormat {Object} (Required) Format specifier
 *   <p>
 *   Any strftime string is supported, such as "%I:%M:%S %p". strftime has several format specifiers defined by the Open group at 
 *   <a href="http://www.opengroup.org/onlinepubs/007908799/xsh/strftime.html">http://www.opengroup.org/onlinepubs/007908799/xsh/strftime.html</a>
 *   PHP added a few of its own, defined at <a href="http://www.php.net/strftime">http://www.php.net/strftime</a>
 *   </p>
 *   <p>
 *   This javascript implementation supports all the PHP specifiers and a few more.  The full list is below.
 *   </p>
 *   <dl>
 *	<dt>%a</dt> <dd>abbreviated weekday name according to the current locale</dd>
 *	<dt>%A</dt> <dd>full weekday name according to the current locale</dd>
 *	<dt>%b</dt> <dd>abbreviated month name according to the current locale</dd>
 *	<dt>%B</dt> <dd>full month name according to the current locale</dd>
 *	<dt>%c</dt> <dd>preferred date and time representation for the current locale</dd>
 *	<dt>%C</dt> <dd>century number (the year divided by 100 and truncated to an integer, range 00 to 99)</dd>
 *	<dt>%d</dt> <dd>day of the month as a decimal number (range 01 to 31)</dd>
 *	<dt>%D</dt> <dd>same as %m/%d/%y</dd>
 *	<dt>%e</dt> <dd>day of the month as a decimal number, a single digit is preceded by a space (range " 1" to "31")</dd>
 *	<dt>%F</dt> <dd>same as %Y-%m-%d (ISO 8601 date format)</dd>
 *	<dt>%g</dt> <dd>like %G, but without the century</dd>
 *	<dt>%G</dt> <dd>The 4-digit year corresponding to the ISO week number</dd>
 *	<dt>%h</dt> <dd>same as %b</dd>
 *	<dt>%H</dt> <dd>hour as a decimal number using a 24-hour clock (range 00 to 23)</dd>
 *	<dt>%I</dt> <dd>hour as a decimal number using a 12-hour clock (range 01 to 12)</dd>
 *	<dt>%j</dt> <dd>day of the year as a decimal number (range 001 to 366)</dd>
 *	<dt>%k</dt> <dd>hour as a decimal number using a 24-hour clock (range 0 to 23); single digits are preceded by a blank. (See also %H.)</dd>
 *	<dt>%l</dt> <dd>hour as a decimal number using a 12-hour clock (range 1 to 12); single digits are preceded by a blank. (See also %I.) </dd>
 *	<dt>%m</dt> <dd>month as a decimal number (range 01 to 12)</dd>
 *	<dt>%M</dt> <dd>minute as a decimal number</dd>
 *	<dt>%n</dt> <dd>newline character</dd>
 *	<dt>%p</dt> <dd>either "AM" or "PM" according to the given time value, or the corresponding strings for the current locale</dd>
 *	<dt>%P</dt> <dd>like %p, but lower case</dd>
 *	<dt>%r</dt> <dd>time in a.m. and p.m. notation equal to %I:%M:%S %p</dd>
 *	<dt>%R</dt> <dd>time in 24 hour notation equal to %H:%M</dd>
 *	<dt>%s</dt> <dd>number of seconds since the Epoch, ie, since 1970-01-01 00:00:00 UTC</dd>
 *	<dt>%S</dt> <dd>second as a decimal number</dd>
 *	<dt>%t</dt> <dd>tab character</dd>
 *	<dt>%T</dt> <dd>current time, equal to %H:%M:%S</dd>
 *	<dt>%u</dt> <dd>weekday as a decimal number [1,7], with 1 representing Monday</dd>
 *	<dt>%U</dt> <dd>week number of the current year as a decimal number, starting with the
 *			first Sunday as the first day of the first week</dd>
 *	<dt>%V</dt> <dd>The ISO 8601:1988 week number of the current year as a decimal number,
 *			range 01 to 53, where week 1 is the first week that has at least 4 days
 *			in the current year, and with Monday as the first day of the week.</dd>
 *	<dt>%w</dt> <dd>day of the week as a decimal, Sunday being 0</dd>
 *	<dt>%W</dt> <dd>week number of the current year as a decimal number, starting with the
 *			first Monday as the first day of the first week</dd>
 *	<dt>%x</dt> <dd>preferred date representation for the current locale without the time</dd>
 *	<dt>%X</dt> <dd>preferred time representation for the current locale without the date</dd>
 *	<dt>%y</dt> <dd>year as a decimal number without a century (range 00 to 99)</dd>
 *	<dt>%Y</dt> <dd>year as a decimal number including the century</dd>
 *	<dt>%z</dt> <dd>numerical time zone representation</dd>
 *	<dt>%Z</dt> <dd>time zone name or abbreviation</dd>
 *	<dt>%%</dt> <dd>a literal "%" character</dd>
 *   </dl>
 *  @param sLocale {String} (Optional)</dt>
 *   The locale to use when displaying days of week, months of the year, and other locale specific
 *   strings. If not specified, this defaults to "en" (though this may be overridden by the deprecated Y.config.locale).
 *   The following locales are built in:
 *   <dl>
 *    <dt>en</dt>
 *    <dd>English</dd>
 *    <dt>en-US</dt>
 *    <dd>US English</dd>
 *    <dt>en-GB</dt>
 *    <dd>British English</dd>
 *    <dt>en-AU</dt>
 *    <dd>Australian English (identical to British English)</dd>
 *   </dl>
 * @return {String} Formatted date for display.
 */
function strftime(oDate, sFormat, sLocale) {
	var locale;

	if(!oDate) {
		return "";
	}

	if(!sFormat) {
		sFormat="";
	}

	if(!sLocale) {
		sLocale = 'en-US';
	}

	sLocale = sLocale.replace(/_/g, "-");

	// Make sure we have a definition for the requested locale, or default to en.
	if(!LOCALES[sLocale]) {
		console.warn("selected locale " + sLocale + " not found, trying alternatives");
		var tmpLocale = sLocale.replace(/-[a-zA-Z]+$/, "");
		if(tmpLocale in LOCALES) {
			sLocale = tmpLocale;
		} else {
			sLocale = "en";
		}
		console.info("falling back to " + sLocale);
	}

	locale = LOCALES[sLocale];
    
	var replace_aggs = function (m0, m1) {
		var f = aggregates[m1];
		return (f === "locale" ? locale[m1] : f);
	};

	var replace_formats = function (m0, m1) {
		var f = formats[m1];
		if(typeof f == 'string')					// string => built in date function
			return oDate[f]();
		else if(typeof f == 'function')					// function => our own function
			return f.call(oDate, oDate, locale);
		else if(f instanceof Array && typeof f[0] === 'string')		// built in function with padding
			return xPad(oDate[f[0]](), f[1]);
		else {
			console.warn("unrecognised replacement type, please file a bug (format: " + sFormat + ")");
			return m1;
		}
	};

	// Preprocess by replacing %% with %<BS>, then later we'll replace %<BS> with %%
	// XXX this is a hack.  There's a very low, but non-0 probability that an actual %<BS>
	// will show up in a string, and this will break when that happens. -- Philip 2011/01/10
	sFormat = sFormat.replace(/%%/g, "%\b");

	// First replace aggregates (run in a loop because an agg may be made up of other aggs)
	while(sFormat.match(/%[cDFhnrRtTxX]/)) {
		sFormat = sFormat.replace(/%([cDFhnrRtTxX])/g, replace_aggs);
	}

	// Now replace formats (do not run in a loop otherwise %%a will be replaced with the value of %a)
	var str = sFormat.replace(/%([aAbBCdegGHIjklmMpPsSuUVwWyYzZ])/g, replace_formats);

	// Post-process now to change %<BS> back to %%
	str = str.replace("%\b", '%%');

	replace_aggs = replace_formats = undefined;

	return str;
}

var LOCALES = {};

LOCALES['en'] = {
	a: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
	A: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
	b: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
	B: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
	c: "%a %d %b %Y %T %Z",
	p: ["AM", "PM"],
	P: ["am", "pm"],
	r: "%I:%M:%S %p",
	x: "%d/%m/%y",
	X: "%T"
};

function addLocale(sName, oLocale, sBase) {
	if(!sBase)
		sBase = 'en';
	LOCALES[sName] = oLocale;

	for(k in LOCALES[sBase]) {
		if(!(k in oLocale)) {
			LOCALES[sName][k] = LOCALES[sBase][k];
		}
	}
}

addLocale('en-US', {
	c: "%a %d %b %Y %I:%M:%S %p %Z",
	x: "%m/%d/%Y",
	X: "%I:%M:%S %p"
});

addLocale('en-GB', {
	r: "%l:%M:%S %P %Z"
});

addLocale('en-AU', {});

strftime.addLocale=addLocale;
module.exports = strftime;


});

require.define("/node_modules/date-helper/node_modules/tag-helper/package.json", function (require, module, exports, __dirname, __filename) {
module.exports = {"main":"./tag_helper.js"}
});

require.define("/node_modules/date-helper/node_modules/tag-helper/tag_helper.js", function (require, module, exports, __dirname, __filename) {
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

});

require.define("/node_modules/date-helper/node_modules/instance-tag/package.json", function (require, module, exports, __dirname, __filename) {
module.exports = {"main":"./instance_tag.js"}
});

require.define("/node_modules/date-helper/node_modules/instance-tag/instance_tag.js", function (require, module, exports, __dirname, __filename) {
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

});

require.define("/node_modules/url-helper/package.json", function (require, module, exports, __dirname, __filename) {
module.exports = {"main":"./url_helper.js"}
});

require.define("/node_modules/url-helper/url_helper.js", function (require, module, exports, __dirname, __filename) {
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

});

require.define("/node_modules/url-helper/node_modules/tag-helper/package.json", function (require, module, exports, __dirname, __filename) {
module.exports = {"main":"./tag_helper.js"}
});

require.define("/node_modules/url-helper/node_modules/tag-helper/tag_helper.js", function (require, module, exports, __dirname, __filename) {
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

});

require.define("/node_modules/asset-tag-helper/package.json", function (require, module, exports, __dirname, __filename) {
module.exports = {"main":"./asset_tag_helper.js"}
});

require.define("/node_modules/asset-tag-helper/asset_tag_helper.js", function (require, module, exports, __dirname, __filename) {
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

});

require.define("/node_modules/asset-tag-helper/node_modules/tag-helper/package.json", function (require, module, exports, __dirname, __filename) {
module.exports = {"main":"./tag_helper.js"}
});

require.define("/node_modules/asset-tag-helper/node_modules/tag-helper/tag_helper.js", function (require, module, exports, __dirname, __filename) {
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

});

require.define("/node_modules/form-options-helper/package.json", function (require, module, exports, __dirname, __filename) {
module.exports = {"main":"./form_options_helper.js"}
});

require.define("/node_modules/form-options-helper/form_options_helper.js", function (require, module, exports, __dirname, __filename) {
(function() {
  var FormOptionsHelper, TagHelper, helper,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  require('cream');

  TagHelper = require('tag-helper');

  FormOptionsHelper = (function() {

    function FormOptionsHelper() {
      this.extract_selected_and_disabled = __bind(this.extract_selected_and_disabled, this);
      this.is_option_value_selected = __bind(this.is_option_value_selected, this);
      this.option_text_and_value = __bind(this.option_text_and_value, this);
      this.option_html_attributes = __bind(this.option_html_attributes, this);
      this.options_for_select = __bind(this.options_for_select, this);
    }

    FormOptionsHelper.prototype.options_for_select = function(container, selected) {
      var disabled, _ref,
        _this = this;
      if (selected == null) selected = null;
      if (typeof container === 'string') return container;
      _ref = this.extract_selected_and_disabled(selected).map(function(r) {
        return Array.wrap(r).map(function(item) {
          if (item instanceof String) {
            return item;
          } else {
            return String(item);
          }
        });
      }), selected = _ref[0], disabled = _ref[1];
      if (Object.isPlainObject(container)) container = Object.toArray(container);
      return container.map(function(element) {
        var disabled_attribute, html_attributes, selected_attribute, text, value, _ref2;
        html_attributes = _this.option_html_attributes(element);
        _ref2 = _this.option_text_and_value(element).map(function(item) {
          if (item instanceof String) {
            return item;
          } else {
            return String(item);
          }
        }), text = _ref2[0], value = _ref2[1];
        if (_this.is_option_value_selected(value, selected)) {
          selected_attribute = ' selected="selected"';
        }
        if (disabled && _this.is_option_value_selected(value, disabled)) {
          disabled_attribute = ' disabled="disabled"';
        }
        return "<option value=\"" + (TagHelper.html_escape(value)) + "\"" + (selected_attribute || '') + (disabled_attribute || '') + (html_attributes || '') + ">" + (TagHelper.html_escape(text)) + "</option>";
      }).join("\n").html_safe();
    };

    FormOptionsHelper.prototype.option_html_attributes = function(element) {
      var html_attributes, k, v, _ref;
      if (!(element instanceof Array)) return "";
      html_attributes = [];
      _ref = element.select(function(e) {
        return Object.isPlainObject(e);
      }).reduce(Object.merge, {});
      for (k in _ref) {
        if (!__hasProp.call(_ref, k)) continue;
        v = _ref[k];
        html_attributes.push(" " + k + "=\"" + (TagHelper.html_escape(v.toString())) + "\"");
      }
      return html_attributes.join('');
    };

    FormOptionsHelper.prototype.option_text_and_value = function(option) {
      var _this = this;
      if (option instanceof Array) {
        option = option.reject(function(e) {
          return Object.isPlainObject(e);
        });
        return [option.first(), option.last()];
      } else if ((!(option instanceof String)) && (option.first instanceof Function) && (option.last instanceof Function)) {
        return [option.first(), option.last()];
      } else {
        return [option, option];
      }
    };

    FormOptionsHelper.prototype.is_option_value_selected = function(value, selected) {
      if (selected instanceof Array) {
        return __indexOf.call(selected, value) >= 0;
      } else if (Object.isPlainObject(selected)) {
        return selected[value] != null;
      } else {
        return value === selected;
      }
    };

    FormOptionsHelper.prototype.extract_selected_and_disabled = function(selected) {
      var options;
      if (selected instanceof Function) {
        return [selected, null];
      } else {
        selected = Array.wrap(selected);
        options = selected.extract_options();
        return [(options.selected != null ? options.selected : selected), options.disabled];
      }
    };

    return FormOptionsHelper;

  })();

  helper = new FormOptionsHelper();

  exports.options_for_select = helper.options_for_select;

}).call(this);

});

require.define("/node_modules/form-options-helper/node_modules/tag-helper/package.json", function (require, module, exports, __dirname, __filename) {
module.exports = {"main":"./tag_helper.js"}
});

require.define("/node_modules/form-options-helper/node_modules/tag-helper/tag_helper.js", function (require, module, exports, __dirname, __filename) {
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

});

require.define("/node_modules/form-tag-helper/package.json", function (require, module, exports, __dirname, __filename) {
module.exports = {"main":"./form_tag_helper.js"}
});

require.define("/node_modules/form-tag-helper/form_tag_helper.js", function (require, module, exports, __dirname, __filename) {
(function() {
  var FormTagHelper, TagHelper, helper,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  require('cream');

  TagHelper = require('tag-helper');

  FormTagHelper = (function() {

    function FormTagHelper() {
      this.sanitize_to_id = __bind(this.sanitize_to_id, this);
      this.select_tag = __bind(this.select_tag, this);
    }

    FormTagHelper.prototype.select_tag = function(name, option_tags, options) {
      var html_name, prompt;
      if (option_tags == null) option_tags = null;
      if (options == null) options = {};
      html_name = options.multiple === true && (!new String(name).endsWith("[]")) ? "" + name + "[]" : name;
      if (Object["delete"](options, 'include_blank')) {
        option_tags = "<option value=\"\"></option>".html_safe().concat(option_tags);
      }
      if (prompt = Object["delete"](options, 'prompt')) {
        option_tags = ("<option value=\"\">" + prompt + "</option>").html_safe().concat(option_tags);
      }
      return TagHelper.content_tag('select', option_tags, Object.update({
        name: html_name,
        id: this.sanitize_to_id(name)
      }, options));
    };

    FormTagHelper.prototype.sanitize_to_id = function(name) {
      return new String(name).replace(/]/g, '').replace(/[^-a-zA-Z0-9:.]/g, "_");
    };

    return FormTagHelper;

  })();

  helper = new FormTagHelper();

  exports.select_tag = helper.select_tag;

}).call(this);

});

require.define("/node_modules/form-tag-helper/node_modules/tag-helper/package.json", function (require, module, exports, __dirname, __filename) {
module.exports = {"main":"./tag_helper.js"}
});

require.define("/node_modules/form-tag-helper/node_modules/tag-helper/tag_helper.js", function (require, module, exports, __dirname, __filename) {
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

});

require.define("/cafe.coffee", function (require, module, exports, __dirname, __filename) {
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

});
require("/cafe.coffee");
