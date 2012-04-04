# TODO this should really check the browser-cafe.js file to make sure the compilation went smoothly
require '../cafe.coffee'

describe 'Cafe', ->
  it 'should handle link_to(image_tag("the_only"), "/go") correctly', ->
    expect(link_to(image_tag('the_only'), '/go')).toEqual '<a href="/go"><img alt="The_only" src="/images/the_only" /></a>'
