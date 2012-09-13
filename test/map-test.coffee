if typeof require is 'function'
  buster = require 'buster'
  pp     = require '../lib/pp.js'

cps_num_id = (next, v) ->
  if typeof v isnt 'number'
    next new TypeError 'require number'
  else
    next null, v

buster.testCase 'pp.map',
  'when array: [], receive []': (done) ->
    pp.map cps_num_id, (error, result) ->
      assert.isNull error
      assert.equals result, []
      done()
    , []

  'when invalid case, receive error': (done) ->
    pp.map cps_num_id, (error, result) ->
      assert error instanceof TypeError
      done()
    , [ 1, 2, 'not number', 4, 5 ]

  'mapping iterator does not overwrite origin': (done) ->
    origin = [1..5]

    iteration = pp.map (next, v) ->
      if typeof v isnt 'number'
        next new TypeError('require number')
      else
        next null, v * 2
    , (error, result) ->
      assert.isNull error
      assert.equals result, [2, 4, 6, 8, 10]
      assert.equals origin, [1..5]
      done()
    iteration origin

  'iterate object as hash map': (done) ->
    pp.map (next, v, k) ->
      next null, v * 2
    , (error, result) ->
      assert.isNull error
      assert.equals result,
        hoge: 50
        huga: 60
        foo: 80
      done()
    ,
      hoge: 25
      huga: 30
      foo: 40

  "though invoked async, result's ordering is kept": (done) ->
    origin = [1..5]
    order  = []
    delay  = 0
    pp.map (next, v, i, it) ->
      delay = 30 * (it.length - i)
      setTimeout ->
        order.push v
        next null, v
      , delay
    , (error, result) ->
      assert.isNull error
      assert.equals order, [5, 4, 3, 2, 1]
      assert.equals result, origin
      done()
    , origin
