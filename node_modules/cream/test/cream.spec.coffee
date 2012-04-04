require '../cream.coffee'

describe 'Cream', ->
  it 'Object.delete(a: 1, "a") == 1', ->
    expect(Object.delete(a: 1, "a")).toEqual 1

  it "[1,2,3].max() is 3", ->
    expect([1,2,3].max()).toEqual 3

  it "[3,1,2].min() is 1", ->
    expect([3,1,2].min()).toEqual 1

  it "[1,2,3].zip [4, 5, 6], [7, 8], [9] is [ [ 1, 4, 7, 9 ],[ 2, 5, 8, undefined ],[ 3, 6, undefined, undefined ] ]", ->
    expect([1,2,3].zip [4, 5, 6], [7, 8], [9]).toEqual [ [ 1, 4, 7, 9 ],[ 2, 5, 8, undefined ],[ 3, 6, undefined, undefined ] ]

  it '"a_b_c".dasherize() is "a-b-c"', ->
    expect("a_b_c".dasherize()).toEqual "a-b-c"

  it '"a b c".dasherize(\' \') is "a-b-c"', ->
    expect("a b c".dasherize(' ')).toEqual "a-b-c"

  it '[3,2,1]".first() is 3', ->
    expect([3,2,1].first()).toEqual 3

  it '[3,2,1]".last() is 1', ->
    expect([3,2,1].last()).toEqual 1

  it '[3,2,1]".butLast() is [3,2]', ->
    expect([3,2,1].butLast()).toEqual [3,2]
