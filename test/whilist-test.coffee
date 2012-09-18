if typeof require is 'function'
  buster = require 'buster'
  pp     = require '../lib/pp'

cps_fib = (callback, n) ->
  pp.whilist (next, c) ->
    next null, c > 0
  , (next, c, a, b) ->
    next null, c - 1, b, a + b
  , (error, c, a, b) ->
    callback error, b
  , [ n, 1, 0 ]

buster.testCase 'pp.whilist',
  '<example> fibonacci(10)': (done) ->
    cps_fib (error, result) ->
      assert.isNull error
      assert.same result, 55
      done()
    , 10

  '<example> fibonacci(10000)': (done) ->
    cps_fib (error, result) ->
      assert.isNull error
      assert.same result, Infinity
      done()
    , 10000
