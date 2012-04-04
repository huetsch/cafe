# Copyright (C) 2012 Mark Huetsch
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

require 'cream'

TagHelper = require 'tag-helper'

# TODO not really sure how Ruby's basename is implemented, but this seems to emulate it
basename = (path, suffix=null) ->
  name = path.split('/').last()
  if suffix
    name.replace(new RegExp("#{suffix.replace(/\./g, "\\.").replace(/\*/g, '.*')}$"), '')
  else
    name

#console.log basename('foo/bar.jpg', '.jpg') # should equal 'bar'
#console.log basename('foo/bar.jpg', '.*') # should equal 'bar'
#console.log basename('foo/bar.jpg', 'jpg') # should equal 'bar.'

class AssetTagHelper
  # TODO This will not play nicely with Rails' asset fingerprinting. Someone could probably do something interesting by
  # making it easy to cache images in the browser. But I have not given a lot of thought to such matters and for now
  # let's just keep things simple
  image_path: (source) ->
    # from rails:
    # asset_paths.compute_public_path(source, 'images')
    #
    "/images/#{source}"

  path_to_image: (source) ->
    @image_path(source)

  image_tag: (source, options = {}) ->
    src = options.src = @path_to_image(source)
    unless src?.match /^cid:/
      options.alt ||= @image_alt(src)
    if size = Object.delete options, 'size'
      [options.width, options.height] = size.split('x') if size.match /^\d+x\d+$/
    if mouseover = Object.delete options, 'mouseover'
      options.onmouseover = "this.src='#{@path_to_image(mouseover)}'"
      options.onmouseout = "this.src='#{src}'"
    TagHelper.tag('img', options)

  image_alt: (src) ->
    basename(src, '.*').capitalize()

helper = new AssetTagHelper()

exports.image_path = helper.image_path
exports.path_to_image = helper.path_to_image
exports.image_tag = helper.image_tag
exports.image_alt = helper.image_alt
