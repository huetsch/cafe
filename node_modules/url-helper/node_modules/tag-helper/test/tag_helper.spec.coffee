TagHelper = require '../tag_helper.coffee'

# note, the sorting of attributes seems different than rails, but I don't understand why from the code. not a big deal.
describe "TagHelper", ->
  it "passes through strings with nothing to escape", ->
    expect(TagHelper.html_escape('1')).toEqual '1'

  it "properly escapes", ->
    expect(TagHelper.html_escape("is a > 0 & a < 10?")).toEqual "is a &gt; 0 &amp; a &lt; 10?"

  it "properly handles 'br' as a tag", ->
    expect(TagHelper.tag("br")).toEqual "<br />"

  it "properly handles 'br' as an open tag", ->
    expect(TagHelper.tag("br", null, true)).toEqual "<br>"

  it "properly handles disabled text input", ->
    expect(TagHelper.tag("input", type: 'text', disabled: true)).toEqual '<input disabled="disabled" type="text" />'

  it "properly handles an img tag with an & in the src", ->
    expect(TagHelper.tag("img", src: "open & shut.png")).toEqual '<img src="open &amp; shut.png" />'

  it "properly handles an img tag with a non-escaped value in the src", ->
    expect(TagHelper.tag("img", {src: "open &amp; shut.png"}, false, false)).toEqual '<img src="open &amp; shut.png" />'

  it "properly handles a div with a data hash attached", ->
    expect(TagHelper.tag("div", data: {name: 'Stephen', city_state: ["Chicago", "IL"]})).toEqual '<div data-city-state="[&quot;Chicago&quot;,&quot;IL&quot;]" data-name="Stephen" />'

  it "properly handles a paragraph content tag with 'hello world'", ->
    expect(TagHelper.content_tag('p', "Hello world!")).toEqual "<p>Hello world!</p>"

  # TODO safebuffer is a nasty kludge
  it "properly handles a div content tag with a nested paragraph tag containing 'hello world' and an added class", ->
    expect(TagHelper.content_tag('div', TagHelper.content_tag('p', "Hello world!"), class: "strong")).toEqual '<div class="strong"><p>Hello world!</p></div>'

  it "properly handles a select with multiple set to true", ->
    expect(TagHelper.content_tag("select", '...options...', multiple: true)).toEqual '<select multiple="multiple">...options...</select>'
