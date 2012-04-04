DateTimeSelector = require '../datetime_selector.coffee'

describe "DateTimeSelector", ->
  it "loads DateTimeSelector ok", ->
    expect(new DateTimeSelector().DEFAULT_PREFIX).toEqual "date"

  it "properly handles build_options(15, start: 1, end: 31)", ->
    expect(new DateTimeSelector().build_options(15, start: 1, end: 3).valueOf()).toEqual "<option value=\"01\">01</option>\n<option value=\"02\">02</option>\n<option value=\"03\">03</option>\n"

  it "properly handles build_options(15, start: 1, end: 5, step: 2)", ->
    expect(new DateTimeSelector().build_options(15, start: 1, end: 5, step: 2).valueOf()).toEqual "<option value=\"01\">01</option>\n<option value=\"03\">03</option>\n<option value=\"05\">05</option>\n"
