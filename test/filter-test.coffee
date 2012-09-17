if typeof require is 'function'
  buster = require 'buster'
  pp = require '../lib/pp'

buster.testCase 'pp.filter',
  'when receiver isnt function, throw error': (done) ->
    try
      pp.filter (next, v) ->
        next null, yes
      , 'not function', [1..9]
    catch error
      assert error instanceof TypeError
      done()

  'when iterator isnt function, receive error': (done) ->
    pp.filter 'not function', (error, result) ->
      assert error instanceof TypeError
      done()
    , [1..9]

  'filtering array by predicate': (done) ->
    pp.filter (next, v) ->
      next null, v % 2 < 1
    , (error, result) ->
      assert.isNull error
      assert.equals result, [2, 4]
      done()
    , [1..5]

  'when nothing is match filter, receive []': (done) ->
    pp.filter (next, v) ->
      next null, v > 10
    , (error, result) ->
      assert.isNull error
      assert.equals result, []
      done()
    , [1..5]

  'when all matches, receive all elements': (done) ->
    pp.filter (next, v) ->
      next null, typeof v is 'number'
    , (error, result) ->
      assert.isNull error
      assert.equals result, [1..5]
      done()
    , [1..5]

  'enable filter for hash map': (done) ->
    pp.filter (next, v, k) ->
      next null, k.match /^_/i
    , (error, result) ->
      assert.isNull error
      assert.equals result,
        _id: 0xff
        _name: 'test'
      done()
    ,
      _id: 0xff
      foo: 'foo'
      bar: 'bar'
      _name: 'test'

  'when nothing match predicate, receive empty object': (done) ->
    pp.filter (next, v, k) ->
      next null, typeof v is 'function'
    , (error, result) ->
      assert.isNull error
      assert.equals result, {}
      done()
    ,
      bool: yes
      name: 'test hash'
      id: 0xf91
      age: undefined
      child: null
      cleateAt: new Date()
