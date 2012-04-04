# Copyright (C) 2012 Mark Huetsch
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

DateTimeSelector = require './datetime_selector'
TagHelper = require 'tag-helper'
InstanceTag = require 'instance-tag'

# TODO prompt_tag
class DateHelper
  date_select: (object_name, method, options = {}, html_options = {}) ->
    delete options.object
    #console.log 'building tag'
    tag = new InstanceTag(object_name, method, @, options)
    #console.log 'done building tag'
    #console.log tag
    tag.to_date_select_tag(options, html_options)
    #new InstanceTag(object_name, method, @, options).to_date_select_tag(options, html_options)

  time_select: (object_name, method, options = {}, html_options = {}) ->
    delete options.object
    (new InstanceTag(object_name, method, @, options)).to_time_select_tag(options, html_options)

  datetime_select: (object_name, method, options = {}, html_options = {}) ->
    delete options.object
    (new InstanceTag(object_name, method, @, options)).to_datetime_select_tag(options, html_options)

  select_datetime: (datetime = new Date(), options = {}, html_options = {}) ->
    (new DateTimeSelector(datetime, options, html_options)).select_datetime()

  select_date: (date = new Date(), options = {}, html_options = {}) ->
    (new DateTimeSelector(date, options, html_options)).select_date()

  select_time: (datetime = Time.current, options = {}, html_options = {}) ->
    (new DateTimeSelector(datetime, options, html_options)).select_time()

  select_second: (datetime, options = {}, html_options = {}) ->
    (new DateTimeSelector(datetime, options, html_options)).select_second()

  select_minute: (datetime, options = {}, html_options = {}) ->
    (new DateTimeSelector(datetime, options, html_options)).select_minute()

  select_hour: (datetime, options = {}, html_options = {}) ->
    (new DateTimeSelector(datetime, options, html_options)).select_hour()

  select_day: (date, options = {}, html_options = {}) ->
    (new DateTimeSelector(date, options, html_options)).select_day()

  select_month: (date, options = {}, html_options = {}) ->
    (new DateTimeSelector(date, options, html_options)).select_month()

  select_year: (date, options = {}, html_options = {}) ->
    (new DateTimeSelector(date, options, html_options)).select_year()

InstanceTag::to_date_select_tag = (options = {}, html_options = {}) ->
  @datetime_selector(options, html_options).select_date().html_safe().valueOf()

InstanceTag::to_time_select_tag = (options = {}, html_options = {}) ->
  @datetime_selector(options, html_options).select_time().html_safe().valueOf()

InstanceTag::to_datetime_select_tag = (options = {}, html_options = {}) ->
  @datetime_selector(options, html_options).select_datetime().html_safe().valueOf()

InstanceTag::datetime_selector = (options, html_options) ->
  #console.log 'entering datetime_selector'
  #console.log '@object:'
  #console.log @object
  #console.log '@method_name:'
  #console.log @method_name
  # TODO this is or'd with value(object) in Rails, but I don't totally understand what that means
  #console.log "default_datetime(options) #{@default_datetime(options)}"
  datetime = @object[@method_name]?() or @default_datetime(options)
  #console.log 'datetime:'
  #console.log datetime
  @auto_index ||= null

  options = Object.clone(options)
  options.field_name = @method_name
  options.include_position = true
  options.prefix ||= @object_name
  options.index = @auto_index if (@auto_index and not options.index?)

  new DateTimeSelector(datetime, options, html_options)

InstanceTag::default_datetime = (options) ->
  #console.log 'entering default_datetime'
  #console.log 'options'
  #console.log options
  unless options.include_blank or options.prompt
    if not options.default
      new Date()
    else if options.default instanceof Date
      options.default
    else
      default_options = Object.clone options.default

      # rename 'minute' and 'second' to 'min' and 'sec'

      # XXX this is a date object, unlike the ruby, we can't just set the attributes this way
      default_options.min ||= default_options.minute
      default_options.sec ||= default_options.second

      time = new Date()

      # date -> day...
      for key in ['month', 'hours', 'minutes', 'seconds']
        default_options[key] ||= time["get#{key.capitalize()}"]()
      default_options.fullYear ||= time["getFullYear"]()
      default_options.day ||= time["getDate"]()
      #console.log 'default options'
      #console.log default_options

      new Date(default_options.fullYear, default_options.month, default_options.day, default_options.hours, default_options.minutes, default_options.seconds)

module.exports = new DateHelper()
