AssetTagHelper = require '../asset_tag_helper.coffee'

describe 'AssetTagHelper', ->
  it 'AssetTagHelper.image_path("foo") should be "/images/foo"', ->
    expect(AssetTagHelper.image_path('foo')).toEqual '/images/foo'
