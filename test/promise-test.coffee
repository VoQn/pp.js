if typeof require is 'function'
  buster = require 'buster'
  pp     = require '../lib/pp'

buster.testCase 'pp.promise',
  'Promise/A (CommonJS)':
    'deferred procedure object': ->
      promise = pp.promise()
      setTimeout ->
        assert yes
        promise.resolve()
      , 100
      promise
    'stacking procedure': ->
      promise = pp.promise()
      init = 1
      promise
      .then (value) ->
        assert.same value, 1
        value * 2
      .then (value) ->
        assert.same value, 2
        value * 2
      .then (value) ->
        assert.same value, 4
        value * 2
      .then (value) ->
        assert.same value, 8
      setTimeout ->
        promise.resolve init
      , 100
      promise
