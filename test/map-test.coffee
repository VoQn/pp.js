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
    pp.map cps_num_id, ((error, result) ->
      assert.isNull error
      assert.equals result, []
      done()
    ), []

  'when invalid case, receive error': (done) ->
    pp.map cps_num_id, ((error, result) ->
      assert error instanceof TypeError
      done()
    ), [ 1, 2, 'not number', 4, 5 ]

  'mapping iterator does not overwrite origin': (done) ->
    origin = [ 1, 2, 3, 4, 5 ]

    iteration = pp.map((next, v) ->
      if typeof v isnt 'number'
        next new TypeError('require number')
      else
        next null, v * 2
    , (error, result) ->
      assert.isNull error
      assert.equals result, [ 2, 4, 6, 8, 10 ]
      assert.equals origin, [ 1, 2, 3, 4, 5 ]
      done()
    )
    iteration origin

  'iterate object as hash map': (done) ->
    pp.map ((next, v, k) ->
      next null, v * 2
    ), ((error, result) ->
      assert.isNull error
      assert.equals result,
        hoge: 50
        huga: 60
        foo: 80
      done()
    ),
      hoge: 25
      huga: 30
      foo: 40

  "though invoked async, result's ordering is kept": (done) ->
    origin = [ 1, 2, 3, 4, 5 ]
    delay = 0
    pp.map ((next, v) ->
      delay = Math.ceil(Math.random() * 200)
      setTimeout next, delay, null, v
    ), ((error, result) ->
      assert.isNull error
      assert.same result[0], origin[0]
      assert.same result[1], origin[1]
      assert.same result[2], origin[2]
      assert.same result[3], origin[3]
      assert.same result[4], origin[4]
      done()
    ), origin
