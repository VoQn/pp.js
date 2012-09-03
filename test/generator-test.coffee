if typeof require is 'function'
  buster = require 'buster'
  pp     = require '../lib/pp'

buster.testCase 'pp.generator',
  'Generator': ->
    cpsCountUp = ->
      i = 0
      step = (next) ->
        next step, ++i
      pp.generator step

    g = cpsCountUp()

    assert.same g.next(), 1
    assert.same g.next(), 2
    assert.same g.next(), 3

    g.next (v) ->
      assert.same v, 4

    assert.same g.next(), 5

