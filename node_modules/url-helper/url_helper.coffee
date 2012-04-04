# Copyright (C) 2012 Mark Huetsch
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

TagHelper = require 'tag-helper'

class UrlHelper
  # TODO currently we only support backbone style models with an url method and strings
  url_for: (options) ->
    if typeof options is 'string'
      options
    #when Hash
    #  options = options.symbolize_keys.reverse_merge!(:only_path => options[:host].nil?)
    #  super
    #when :back
    #  controller.request.env["HTTP_REFERER"] || 'javascript:history.back()'
    # else
    #  polymorphic_path(options)
    else if options.url and typeof options.url is 'function'
      options.url()

  link_to: (args...) ->
    name = args[0]
    options = args[1] or {}
    html_options = args[2] or {}

    #html_options = convert_options_to_data_attributes(options, html_options)
    url = @url_for(options)

    href = html_options['href']
    tag_options = TagHelper.tag_options(html_options) or ''

    href_attr = "href=\"#{TagHelper.html_escape(url)}\"" unless href
    #"<a #{href_attr}#{tag_options}>#{TagHelper.html_escape(name or url)}</a>".html_safe()
    "<a #{href_attr}#{tag_options}>#{TagHelper.html_escape(name or url)}</a>"

url_helper = new UrlHelper()

exports.link_to = url_helper.link_to
exports.url_for = url_helper.url_for
