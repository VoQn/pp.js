if typeof require is 'function'
  buster = require 'buster'
  pp     = require '../lib/pp'

buster.testCase 'pp.find',
  'find match value by predicate': (done) ->
    pp.find (next, value) ->
      next null, value % 3 is 0
    , (error, result, key) ->
      assert.isNull error
      assert.same result, 3
      assert.same key, 2
      done()
    , [1..5]

  'when nothing is match, receive undefined': (done) ->
    pp.find (next, value) ->
      next null, typeof value is 'string'
    , (error, result) ->
      assert.isNull error
      refute.defined result
      done()
    , [1..5]

  'find match value and key from hash table': (done) ->
    pp.find (next, value, selector) ->
      next null, selector.match /^#/i
    , (error, css, selector) ->
      assert.isNull error
      assert.equals css,
        width: '100%'
      assert.same selector, '#container'
      done()
    ,
      body:
        width: '960px'
      '#container':
        width: '100%'
      '.notice':
        color: '#f00'
