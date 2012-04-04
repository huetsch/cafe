# Copyright (C) 2012 Mark Huetsch
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

require 'cream'

class ArgumentError extends Error

class InstanceTag
  constructor: (object_name, method_name, template_object, object = null) ->
    [@object_name, @method_name] = [Object.clone(String(object_name).valueOf()), Object.clone(String(method_name).valueOf())]
    @template_object = template_object
    regex = /\[\]$/
    if regex.test(@object_name)
      @object_name = @object_name.replace(regex, '')
    else
      regex = /\[\]\]$/
      if regex.test(@object_name)
        @object_name = @object_name.replace(regex, ']')
      else
        regex = null
    @object = @retrieve_object(object)
    #console.log "@object_name"
    #console.log @object_name
    if regex
      str = regex.exec(@object_name)
      @auto_index = @retrieve_autoindex(@object_name[0...@object_name.indexOf(str)])

  retrieve_object: (object) ->
    if object
      object
    else if @template_object["#{@object_name}"]?
      @template_object["#{@object_name}"]

  retrieve_autoindex: (pre_match) ->
    object = @object || @template_object["#{pre_match}"]
    if object
      JSON.stringify object
    else
      throw new ArgumentError("object[] naming but object param and @object var don't exist or don't respond to to_param: #{object.inspect}")

module.exports = InstanceTag
