if typeof require is "function"
  pp = require '../lib/pp'

ARGV = process and process.argv or []
len = if ARGV.length > 2 then ~~(ARGV[2]) else 1.0e+5
fps = if ARGV.length > 3
    Math.min 1000, Math.max(0, ARGV[3])
  else 60

frameRate = ~~(1000 / fps)

console.log """
\x1b[32mBenchmark - pp.js -
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
  console.log f.apply null, args
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
  doTask pp.order, 'pp#order'
  doTask pp.fill, 'pp#fill '

_iterator_tests =
  '#1 pp#each  ':
    type: 'iteration'
    func: pp.each
    iter: (next, value) -> next()
  '#2 pp#map   ':
    type: 'iteration'
    func: pp.map
    iter: (next, value) -> next null, value
  '#3 pp#filter':
    type: 'iteration'
    func: pp.filter
    iter: (next, value) -> next null, value > 0 and value % 3 < 1
  '#4 pp#reject':
    type: 'iteration'
    func: pp.reject
    iter: (next, value) -> next null, value < 1 or value % 7 > 0
  '#5 pp#find  ':
    type: 'iteration'
    func: pp.find
    iter: (next, value) -> next null, value is bigArray[len - 1]
  '#6 pp#any   ':
    type: 'iteration'
    func: pp.any
    iter: (next, value) -> next null, value is bigArray[len - 1]
  '#7 pp#all   ':
    type: 'iteration'
    func: pp.all
    iter: (next, value) -> next null, value > -1

whilistTest = (n) ->
  pp.whilist (next, i) ->
    next null, i > 0
  , (next, i, a, b) ->
    logging ((n, i) -> "pp#whilist -- running [#{n - i}]"), n, i
    next null, i - 1, b, a + b
  , (error, _, __, b) ->
    console.log "\u001b[35m\u001b[1mpp#whilist - done --
      -- #{_time_expr _start_time}
      \n  result >>> #{b}\u001b[0m"
  , [ n, 1, 0 ]

runnerByType = (type, name, runner) ->
  nowInvoke = (name, index) ->
    "\u001b[34m#{name} - running : [#{index}] -- #{_time_expr _start_time}\u001b[0m"
  switch type
    when 'folding'
      (next, memo, value, index, iterable) ->
        logging nowInvoke, name, index
        runner next, memo, value, index, iterable
    else
      (next, value, index, iterable) ->
        logging nowInvoke, name, index
        runner next, value, index, iterable

_start_time = Date.now()

testResults = {}

runnerCallback = (name, startAt, callback) ->
  (error, result) ->
    time = _time_expr startAt
    console.log """
      \u001b[33m#{name} - done -- #{_time_expr _start_time} (#{time})
        result >>> #{prettyPrint result}\u001b[0m
      """
    testResults[name] =
      result: result
      time: time

    callback()

countTestDone = 0

testNames = Object.keys _iterator_tests

afterTest = ->
  timeStamp = Date.now()
  return if ++countTestDone < testNames.length
  finished = yes

  msg = [ "\u001b[1m",
    "All iteration test done -- #{_time_expr _start_time}",
    "\u001b[0m\u001b[32m",
    "\u001b[32mresult:"]

  byLabel = (x) ->
    ~~(x.match(/^#([0-9]+)/i)[1])

  for k in Object.keys(testResults).sort((a, b) -> byLabel(a) - byLabel(b))
    v = testResults[k]
    msg.push "  #{k} : #{prettyPrint v.result} -- #{v.time}"

  msg.push "-----------------------------------------------\u001b[0m"
  console.log msg.join '\n'

do ->
  for name, index in testNames
    runner = _iterator_tests[name]

    console.log """
      \u001b[36m#{name} - start -- #{_time_expr _start_time}\u001b[0m
      """

    runner.func runnerByType(runner.type, name, runner.iter),
      runnerCallback(name, Date.now(), afterTest),
      bigArray,
      frameRate

