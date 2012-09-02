if typeof require is 'function'
  buster = require 'buster'
  pp     = require '../lib/pp'

make_defer_task = (label, delay, order_stack) ->
  (next) ->
    setTimeout () ->
      order_stack.push label
      next null, label
    , delay

buster.testCase 'pp.fill',
  'results keep tasks order': (done) ->
    fire_order = []
    pp.fill [
      make_defer_task '1st', 30, fire_order
      make_defer_task '2nd', 10, fire_order
      make_defer_task '3rd', 20, fire_order
    ], (error, result) ->
      assert.equals result, ['1st', '2nd', '3rd']
      done()
  'do each task ASAP': (done) ->
    fire_order = []
    pp.fill [
      make_defer_task '1st', 75, fire_order
      make_defer_task '2nd', 25, fire_order
      make_defer_task '3rd', 50, fire_order
    ], (error, result) ->
      assert.equals fire_order, ['2nd', '3rd', '1st']
      done()

buster.testCase 'pp.order',
  'do each task keep order': (done) ->
    fire_order = []
    pp.order [
      make_defer_task '1st', 30, fire_order
      make_defer_task '2nd', 10, fire_order
      make_defer_task '3rd', 20, fire_order
    ], (error, result) ->
      assert.equals fire_order, ['1st', '2nd', '3rd']
      assert.equals result, ['1st', '2nd', '3rd']
      done()
