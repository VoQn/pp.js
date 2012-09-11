if typeof require is 'function'
  buster = require 'buster'
  pp     = require '../lib/pp'

buster.testCase 'pp.reject',
  'rejecting array by predicate': (done) ->
    pp.reject (next, v) ->
      next null, v % 2 < 1
    , (error, result) ->
      assert.isNull error
      assert.equals result, [1, 3, 5]
      done()
    , [1..5]

  'when nothing is match reject, received []': (done) ->
    pp.reject (next, v) ->
      next null, typeof v is 'number'
    , (error, result) ->
      assert.isNull error
      assert.equals result, []
      done()
    , [1..5]

  'when all matches, received all elements': (done) ->
    pp.reject (next, v) ->
      next null, v > 10
    , (error, result) ->
      assert.isNull error
      assert.equals result, [1..5]
      done()
    , [1..5]

  'enable filter for hash map': (done) ->
    pp.reject (next, v, k) ->
      next null, k.match /^_/i
    , (error, result) ->
      assert.isNull error
      assert.equals result,
        foo: 'foo'
        bar: 'bar'
      done()
    ,
      _id: 0xff
      foo: 'foo'
      bar: 'bar'
      _name: 'test'

  'when nothing match predicate, receive empty object': (done) ->
    pp.reject (next, v, k) ->
      next null, typeof v isnt 'function'
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
