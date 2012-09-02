if typeof require is 'function'
  buster = require 'buster'
  pp = require '../lib/pp'

buster.testCase 'pp.filter',
  'filtering array by predicate': (done) ->
    pp.filter ((next, v) ->
      next null, v % 2 < 1
    ), ((error, result) ->
      assert.isNull error
      assert.equals result, [ 2, 4 ]
      done()
    ), [ 1, 2, 3, 4, 5 ]

  'when nothing is match filter, receive []': (done) ->
    pp.filter ((next, v) ->
      next null, v > 10
    ), ((error, result) ->
      assert.isNull error
      assert.equals result, []
      done()
    ), [ 1, 2, 3, 4, 5 ]

  'when all matches, receive all elements': (done) ->
    pp.filter ((next, v) ->
      next null, typeof v is 'number'
    ), ((error, result) ->
      assert.isNull error
      assert.equals result, [ 1, 2, 3, 4, 5 ]
      done()
    ), [ 1, 2, 3, 4, 5 ]
