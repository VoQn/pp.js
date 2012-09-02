if typeof require is 'function'
  buster = require 'buster'
  pp     = require '../lib/pp'

add_2_numbers = (next, x, y) ->
  if typeof x isnt 'number' or typeof y isnt 'number'
    next new TypeError 'require number'
  else
    next null, x + y

buster.testCase 'pp.foldr',
  'when apply array: [], callback take init value': (done) ->
    pp.foldr add_2_numbers, ((error, result) ->
      assert.isNull error
      assert.same result, 0
      done()
    ), 0, []

  'when apply array: [x], callback takes f(init, x)': (done) ->
    pp.foldr add_2_numbers, ((error, result) ->
      assert.isNull error
      assert.same result, 2
      done()
    ), 1, [ 1 ]

  'sum of numbers': (done) ->
    pp.foldr add_2_numbers, ((error, result) ->
      assert.isNull error
      assert.same result, 15
      done()
    ), 0, [ 1, 2, 3, 4, 5 ]

  'accmulate from right side of iterable': (done) ->
    pp.foldr ((next, memo, value) ->
      memo.push value
      next null, memo
    ), ((error, result) ->
      assert.isNull error
      assert.equals result, [ 5, 4, 3, 2, 1 ]
      done()
    ), [], [ 1, 2, 3, 4, 5 ]

buster.testCase 'pp.foldr1',
  'when apply array: [], receive invalid error': (done) ->
    pp.foldr1 add_2_numbers, ((error, result) ->
      assert error instanceof TypeError
      refute.same error.message, 'require number'
      done()
    ), []

  'when apply array: [x], receive x': (done) ->
    pp.foldr1 add_2_numbers, ((error, result) ->
      assert.isNull error
      assert.same result, 1
      done()
    ), [ 1 ]

  'sum of numbers': (done) ->
    pp.foldr1 add_2_numbers, ((error, result) ->
      assert.isNull error
      assert.same result, 15
      done()
    ), [ 1, 2, 3, 4, 5 ]

  'accmulate from right side of iterable': (done) ->
    pp.foldr1 ((next, memo, value) ->
      next null, memo - value
    ), ((error, result) ->
      assert.isNull error
      assert.same result, -5
      done()
    ), [ 1, 2, 3, 4, 5 ]
