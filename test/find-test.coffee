if typeof require is 'function'
  buster = require 'buster'
  pp     = require '../lib/pp'

buster.testCase 'pp.find',
  'find match value by predicate': (done) ->
    pp.find (next, value) ->
      next null, value % 3 is 0
    , (error, result) ->
      assert.isNull error
      assert.same result, 3
      done()
    , [ 1, 2, 3, 4, 5 ]

  'when nothing is match, receive undefined': (done) ->
    pp.find (next, value) ->
      next null, typeof value is 'string'
    , (error, result) ->
      assert.isNull error
      refute.defined result
      done()
    , [ 1, 2, 3, 4, 5 ]
