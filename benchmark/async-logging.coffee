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

bigArray = do ->
  array = []
  i = -1
  while ++i < len
    array[i] = i + 1
  array

prettyPrint = (any) ->
  if Array.isArray any
    if any.length > 6
      "[#{any.slice 0, 5}, ... , #{any[any.length - 1]}] (length : #{any.length})"
    else
      "[#{any}]"
  else
    any

_time_expr = (from, opt_to) ->
  to = opt_to or Date.now()
  dt = to - from
  if dt > 6.0e+4
    "#{(0.5 + dt / 6.0e+4) | 0}m #{(dt % 6.0e+4) / 1.0e+3}s"
  else if dt > 1.0e+3
    "#{dt / 1.0e+3}s"
  else
    "#{dt}ms"

finished = no

timeStamp = Date.now()

logging = (f, args...) ->
  now = Date.now()
  return if now - timeStamp < frameRate
  console.log f.apply(null, args)
  timeStamp = now

labelNowRunning = (runnerName, type, index, delay) ->
  "#{runnerName} - #{type} [#{index}]
   #{if type is 'register' then "(after #{delay}ms)" else ""}
   -- #{_time_expr _start_time}"

randomDelay = (delay_width) ->
  Math.floor Math.random() * delay_width + 1

taskList = (runnerName) ->
  makeCallback = (name, index, time_out) ->
    (next) ->
      delay = randomDelay time_out

      console.log "\u001b[35m
        #{labelNowRunning runnerName, 'register', index, delay}
        \u001b[0m"

      timer = setTimeout ->
        clearTimeout timer
        console.log "\u001b[34m
          #{labelNowRunning runnerName, 'invoke', index, delay}
          \u001b[0m"
        next null, name
      , delay

      [ makeCallback("1st", 0, 1000),
        makeCallback("2nd", 1, 1000),
        makeCallback("3rd", 2, 1000),
        makeCallback("4th", 3, 1000),
        makeCallback("5th", 4, 1000) ]

doTask = (runner, runnerName) ->
  runner taskList(runnerName), (error, result) ->
    console.log "\u001b[35m\u001b[1m##{runnerName} - done
      -- #{_time_expr _start_time}
      \n  result >>> #{result}\u001b[0m"

taskRunnerTest = ->
  doTask async.series, 'async#series '
  doTask async.parallel, 'async#parallel'

_iterator_tests =
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
    "\u001b[34m#{n} - running : [#{i}] -- #{_time_expr _start_time}\u001b[0m"

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
      time = _time_expr startAt
      console.log """
        \u001b[33m#{name} - done -- #{_time_expr _start_time} (#{time})
          result >>> #{prettyPrint result}\u001b[0m
        """
      results[name] =
        result: result
        time: time
      after()
  else
    (error, result) ->
      time = _time_expr startAt
      console.log """
        \u001b[33m#{name} - done -- #{_time_expr _start_time} (#{time})
          result >>> #{prettyPrint result}\u001b[0m
        """
      results[name] =
        result: result
        time: time

      after error

_start_time = Date.now()

results = {}

testNames = Object.keys _iterator_tests

countTestDone = 0

afterTest = ->
  timeStamp = Date.now()
  return if ++countTestDone < testNames.length
  finished = yes
  msg = [
    "\u001b[1m",
    "All iteration test done -- #{_time_expr _start_time}",
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

for name, index in testNames
  runner = _iterator_tests[name]

  console.log """
    \u001b[36m#{name} - start -- #{_time_expr _start_time}\u001b[0m
    """

  runner.func bigArray,
    runnerByType(runner.type, name, runner.iter),
    callbackByType(runner.type, name, Date.now(), afterTest)
