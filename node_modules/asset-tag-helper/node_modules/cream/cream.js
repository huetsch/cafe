(function() {
  var blues_strftime,
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
    return new Date(this.valueOf() + 24..hours());
  };

  Date.prototype.yesterday = function() {
    return new Date(this.valueOf() - 24..hours());
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
