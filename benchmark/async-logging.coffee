
startTime = timeStamp = tmpStamp = 0

if typeof require is "function"
  async = require 'async'

ARGV = process and process.argv or []
len = if ARGV.length > 2 then ~~(ARGV[2]) else 1.0e+5
fps = if ARGV.length > 3
    Math.min 1000, Math.max(0, ARGV[3])
  else 60

frameRate = ~~(1000 / fps)

console.log """
\x1b[32mBenchmark - async.js -
-------------------------------
Argment: [1..#{len}] #{if len is 1.0e+5 then '(default)' else ''}
FPS: #{fps} #{if fps is 60 then '(default)' else ''}
preparing tests ...
\x1b[0m
"""

bigArray = [1..len]

prettyPrint = (any) ->
  if Array.isArray any
    if any.length > 6
      "[#{any.slice 0, 5}, ... , #{any[any.length - 1]}] (length : #{any.length})"
    else
      "[#{any}]"
  else
    any

timeExpr = (from, opt_to) ->
  to = opt_to or Date.now()
  dt = to - from
  if dt >= 6.0e+4
    "#{~~(dt / 6.0e+4)}m #{(dt % 6.0e+4) / 1.0e+3}s"
  else if dt >= 1.0e+3
    "#{dt / 1.0e+3}s"
  else
    "#{dt}ms"

logging = (f, args...) ->
  tmpStamp = Date.now()
  return if tmpStamp - timeStamp < frameRate
  console.log f.apply(null, args)
  timeStamp = tmpStamp

labelNowRunning = (runnerName, type, index, delay) ->
  "#{runnerName} - #{type} [#{index}]
   #{if type is 'register' then "(after #{delay}ms)" else ""}
   -- #{timeExpr startTime}"

iterators =
  '#1 async#forEach':
    type: 'iteration'
    func: async.forEach
    iter: (value, next) -> next()
  '#2 async#map    ':
    type: 'iteration'
    func: async.map
    iter: (value, next) -> next null, value
  '#3 async#filter ':
    type: 'predicate'
    func: async.filter
    iter: (value, next) -> next value > 0 and value % 3 < 1
  '#4 async#reject ':
    type: 'predicate'
    func: async.reject
    iter: (value, next) -> next value < 1 or value % 7 > 0
  '#5 async#detect ':
    type: 'predicate'
    func: async.detect
    iter: (value, next) -> next value is bigArray[len - 1]
  '#6 async#some   ':
    type: 'predicate'
    func: async.some
    iter: (value, next) -> next value is bigArray[len - 1]
  '#7 async#every  ':
    type: 'predicate'
    func: async.every
    iter: (value, next) -> next value > -1

runnerByType = (type, name, runner) ->
  nowInvoke = (n, i) ->
    "\u001b[34m#{n} - running : [#{i}] -- #{timeExpr startTime}\u001b[0m"

  index = -1
  switch type
    when 'iteration', 'predicate'
      (value, next) ->
        logging nowInvoke, name, ++index
        runner value, next
    else
      (memo, value, next) ->
        logging nowInvoke, name, ++index
        runner memo, value, next

callbackByType = (type, name, startAt, after) ->
  if type is 'predicate'
    (result) ->
      time = timeExpr startAt
      console.log """
        \u001b[33m#{name} - done -- #{timeExpr startTime} (#{time})
          result >>> #{prettyPrint result}\u001b[0m
        """
      results[name] =
        result: result
        time: time
      after()
  else
    (error, result) ->
      time = timeExpr startAt
      console.log """
        \u001b[33m#{name} - done -- #{timeExpr startTime} (#{time})
          result >>> #{prettyPrint result}\u001b[0m
        """
      results[name] =
        result: result
        time: time

      after error


results = {}

testNames = Object.keys iterators

countTestDone = 0

afterTest = ->
  timeStamp = Date.now()
  return if ++countTestDone < testNames.length
  msg = [
    "\u001b[1m",
    "All iteration test done -- #{timeExpr startTime}",
    "\u001b[0m\u001b[32m",
    "result:"
  ]
  byLabel = (x) ->
    ~~(x.match(/^#([0-9]+)/i)[1])
  for k in Object.keys(results).sort((a, b) -> byLabel(a) - byLabel(b))
    v = results[k]
    msg.push "  #{k} : #{prettyPrint v.result} -- #{v.time}"
  msg.push "-----------------------------------------------\u001b[0m"
  console.log msg.join '\n'


startTime = timeStamp = tmpStamp = Date.now()

for own name, runner of iterators
  console.log """
    \u001b[36m#{name} - start -- #{timeExpr startTime}\u001b[0m
    """
  runner.func bigArray,
    runnerByType(runner.type, name, runner.iter),
    callbackByType(runner.type, name, Date.now(), afterTest)
