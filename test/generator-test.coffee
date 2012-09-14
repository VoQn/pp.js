if typeof require is 'function'
  buster = require 'buster'
  pp     = require '../lib/pp'

buster.testCase 'pp.generator',
  'basic step iteration': ->
    cpsCountUp = ->
      index = 0
      step  = (yieldIt) ->
        yieldIt step, ++index
      pp.generator step

    g = cpsCountUp()

    assert.same g.next(), 1
    assert.same g.next(), 2
    assert.same g.next(), 3

    ret = g.next (v) ->
      assert.same v, 4
    assert.same ret, 4
    assert.same g.next(), 5

  'back to init': ->
    cpsCountUp = ->
      index = 0
      init = (yieldIt) ->
        yieldIt step, index = 0
      step = (yieldIt) ->
        yieldIt step, ++index
      pp.generator step, init

    g = cpsCountUp()
    i = 0
    while ++i < 5
      g.next()
    assert.same g.next(), 5

    assert.same g.reset(), 0
    assert.same g.next(), 1

  'jump arbitrary state': ->
    cpsCountUp = ->
      index = 0
      init = (yieldIt) ->
        yieldIt step, index = 0
      step = (yieldIt) ->
        yieldIt step, ++index
      jump = (yieldIt, x) ->
        if typeof x is 'number'
          index = if 0 < x then ~~(x) else 0
        yieldIt step, index
      pp.generator step, init, jump

    g = cpsCountUp()
    i = 0
    assert.same g.jump(10), 10
    assert.same g.next(), 11

