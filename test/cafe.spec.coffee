# TODO this should really check the browser-cafe.js file to make sure the compilation went smoothly
require '../cafe.coffee'

describe 'Cafe', ->
  it 'should handle link_to(image_tag("the_only"), "/go") correctly', ->
    expect(link_to(image_tag('the_only'), '/go')).toEqual '<a href="/go"><img alt="The_only" src="/images/the_only" /></a>'

  it 'should handle a select_tag with options_for_select correctly', ->
    expect(select_tag 'foo', options_for_select(['a', 'b'])).toEqual "<select id=\"foo\" name=\"foo\"><option value=\"a\">a</option>\n<option value=\"b\">b</option></select>"
