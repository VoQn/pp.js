if typeof require is 'function'
  buster = require 'buster'
  pp = require '../lib/pp'

add_2_numbers = (next, x, y) ->
  if typeof x isnt 'number' or typeof y isnt 'number'
    next new TypeError 'require number'
  else
    next null, x + y

buster.testCase 'pp.foldl',
  'when apply empty array, callback take init value': (done) ->
    pp.foldl add_2_numbers, (error, result) ->
      assert.isNull error
      assert.same result, 0
      done()
    , 0, []

  'when apply array: [x], callback takes f(init, x)': (done) ->
    pp.foldl add_2_numbers, (error, result) ->
      assert.isNull error
      assert.same result, 2
      done()
    , 1, [1]

  'sum of numbers': (done) ->
    pp.foldl add_2_numbers, (error, result) ->
      assert.isNull error
      assert.same result, 15
      done()
    , 0, [1..5]

  'accmulate from left side of iterable': (done) ->
    pp.foldl (next, memo, value) ->
      memo.push value
      next null, memo
    , (error, result) ->
      assert.isNull error
      assert.equals result, [1..5]
      done()
    , [], [1..5]

buster.testCase 'pp.foldl1',
  'when apply empty array, callback takes invalid error': (done) ->
    pp.foldl1 add_2_numbers, (error, result) ->
      assert error instanceof TypeError
      refute.same error.message, 'require number'
      done()
    , []

  'when apply array: [x], callback takes x': (done) ->
    pp.foldl1 add_2_numbers, (error, result) ->
      assert.isNull error
      assert.same result, 1
      done()
    , [1]

  'sum of numbers': (done) ->
    pp.foldl1 add_2_numbers, (error, result) ->
      assert.isNull error
      assert.same result, 15
      done()
    , [1..5]

  'accmulate from left side of iterable': (done) ->
    pp.foldl1 (next, memo, value) ->
      next null, memo - value
    , (error, result) ->
      assert.isNull error
      assert.same result, -13
      done()
    , [1..5]
