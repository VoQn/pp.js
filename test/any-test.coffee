if typeof require is 'function'
  buster = require 'buster'
  pp     = require '../lib/pp'

buster.testCase 'pp.any',
  'if invalid case, receive error': (done) ->
    pp.any (next, value, index) ->
      if typeof value isnt 'number'
        next new TypeError 'require number'
      else
        next null, index > 2
    , (error, result) ->
      assert error instanceof TypeError
      assert.same error.message, 'require number'
      done()
    , [ 1, 2, 'not number', 4, 5 ]

  'all element are falsy by test, receive false': (done) ->
    pp.any (next, value) ->
      next null, value < 0
    , (error, result) ->
      assert.isNull error
      refute result
      done()
    , [ 1, 2, 3, 4, 5 ]

  'some element is true by test, receive true': (done) ->
    pp.any (next, value) ->
      next null, value % 3 is 0
    , (error, result) ->
      assert.isNull error
      assert result
      done()
    , [ 1, 2, 3, 4, 5 ]

buster.testCase 'pp.all',
  'if invalid case, receive error': (done) ->
    pp.all (next, value) ->
      if typeof value isnt 'number'
        next new TypeError 'require number'
      else
        next null, true
    , (error, result) ->
      assert error instanceof TypeError
      assert.same error.message, 'require number'
      done()
    , [ 1, 2, 'not number', 4, 5 ]

  'all element are true by test, receive true': (done) ->
    pp.all (next, value) ->
      next null, value > 0
    , (error, result) ->
      assert.isNull error
      assert result
      done()
    , [ 1, 2, 3, 4, 5 ]

  'some element is falsy by test, receive false': (done) ->
    pp.all (next, value) ->
      next null, value < 3
    , (error, result) ->
      assert.isNull error
      refute result
      done()
    , [ 1, 2, 3, 4, 5 ]
