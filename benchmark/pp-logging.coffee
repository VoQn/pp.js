
startTime = timeStamp = tmpStamp = 0

if typeof require is "function"
  pp = require '../lib/pp'

ARGV = (process and process.argv) or []
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
  console.log f.apply null, args
  timeStamp = tmpStamp

labelNowRunning = (runnerName, type, index, delay) ->
  "#{runnerName} - #{type} [#{index}]
   #{if type is 'register' then "(after #{delay}ms)" else ""}
   -- #{timeExpr startTime tmpStamp}"

bigArray = [1..len]

iterators =
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

runnerByType = (type, name, runner) ->
  nowInvoke = (name, index) ->
    "\u001b[34m#{name} - running : [#{index}] -- #{timeExpr startTime}\u001b[0m"
  switch type
    when 'folding'
      (next, memo, value, index, iterable) ->
        logging nowInvoke, name, index
        runner next, memo, value, index, iterable
    else
      (next, value, index, iterable) ->
        logging nowInvoke, name, index
        runner next, value, index, iterable

testResults = {}

runnerCallback = (name, startAt, callback) ->
  (error, result) ->
    time = timeExpr startAt
    console.log """
      \u001b[33m#{name} - done -- #{timeExpr startTime} (#{time})
        result >>> #{prettyPrint result}\u001b[0m
      """
    testResults[name] =
      result: result
      time: time

    callback()

countTestDone = 0

iteratorsNames = Object.keys iterators

afterTest = ->
  timeStamp = Date.now()
  return if ++countTestDone < iteratorsNames.length

  msg = [ "\u001b[1m",
    "All iteration test done -- #{timeExpr startTime}",
    "\u001b[0m\u001b[32m",
    "\u001b[32mresult:"]

  byLabel = (x) ->
    ~~(x.match(/^#([0-9]+)/i)[1])

  for k in Object.keys(testResults).sort((a, b) -> byLabel(a) - byLabel(b))
    v = testResults[k]
    msg.push "  #{k} : #{prettyPrint v.result} -- #{v.time}"

  msg.push "-----------------------------------------------\u001b[0m"
  console.log msg.join '\n'

startTime = timeStamp = tmpStamp = Date.now()

for own name, runner of iterators
  console.log """
    \u001b[36m#{name} - start -- #{timeExpr startTime}\u001b[0m
    """
  runner.func runnerByType(runner.type, name, runner.iter),
    runnerCallback(name, Date.now(), afterTest),
    bigArray,
    frameRate
