# Control Flow
These API are very similar to functions of async.js.
But here is different argument rule, never blocking user thread, and faster.

+ [pp.iterator](#iterator) - like [async.iterator](https://github.com/caolan/async#iterator)
+ [pp.waterfall](#waterfall) - like [async.waterfall](https://github.com/caolan/async#waterfall)
+ [pp.whilist](#whilist) - like
  [async.whilist](https://github.com/caolan/async#whilist)
+ [pp.until](#until) - like [async.until](https://github.com/caolan/async#until)
+ [pp.fill](#fill) - like
  [async.parallel](https://github.com/caolan/async#parallel)
+ [pp.order](#order) - like [async.series](https://github.com/caolan/async#series)

<a name="iterator"/>
## pp.iterator(procs)

### Arguments
* procs {Array.&lt;function(any...)&gt;} - procedure list

### Example

```coffeescript
current = ''
iter = pp.iterator [
  ->
    current = '1st'
  , ->
    current = '2nd'
  , ->
    current = '3rd'
]

iter2 = iter()
console.log current # '1st'

iter3 = iter2()
console.log current # '2nd'

iter3()
console.log current # '3rd'

iter4 = iter.next()
iter4()
console.log current # '2nd'
```

<a name="waterfall"/>
## pp.waterfall(procs, callback, [timeSlice])

### Arguments
* procs {Array.&lt;Iterator&gt;} - procedure list
* callback(error, results...) - callback after iteration
* timeSlice - **optional** time slice for iteration loop.

### Example
```coffeescript
pp.waterfall [
  (next) ->
    next null, 1
  , (next, v) ->
    next null, v, v * 2 # {v: 1}
  , (next, v1, v2) ->
    next null, v1 + v2 # {v1: 1, v2: 2}
], (error, result) ->
  console.log error is null # true
  console.log result # 3
```

<a name="whilist"/>
## pp.whilist(predicator, iterator, callback, init, [timeSlice])

### Arguments

* predicator {Predicator} - test function that iterator should stop or not
* iterator {Iterator} - loop procedure
* callback(?Error, Array) callback procedure
* init {Array} - parameter for loop iteration
* timeSlice - **optional** time slice for iteration loop.

### Example

```coffeescript
# sync fibonacci function
fib = (n) ->
  iter = (c, a, b) ->
    if c < 1
      b
    else
      iter c - 1, b, a + b
  iter n, 0, 1

# async fibonacci function
ppfib = (callback, n) ->
  pp.whilist (next, c) ->
    next null, c < 1
  , (next, c, a, b) ->
    next null, c - 1, b, a + b
  , (error, c, a, b) ->
    callback error, b
  , [n, 0, 1]

ppfib (e, x) ->
  console.log x
, 10 # => "55"
```

-------------------------------------------------------------------------------

<a name="until"/>
## pp.until(predicator, iterator, callback, init, [timeSlice])
`pp.until` is reverse of `pp.whilist`

### Arguments

* predicator {Predicator} - test function that iterator should stop or not
* iterator {Iterator} - loop procedure
* callback(?Error, Array) callback procedure
* init {Array} - parameter for loop iteration
* timeSlice - **optional** time slice for iteration loop.

-------------------------------------------------------------------------------

<a name="fill"/>
## pp.fill(procs, callback, [timeSlice])

### Arguments
* procs: Array.&lt;Iterator&gt; task procedure list
* callback(?Error, Array) callback procedure
* timeSlice - **optional** time slice for iteration loop.

### Example
```coffeescript
fireStack = []

pp.fill [
  (next) ->
    setTimeout ->
      fireStack.push '1st'
      next null, '1st'
    , 100
  , (next) ->
    setTimeout ->
      fireStack.push '2nd'
      next null, '2nd'
    , 200
  , (next) ->
    setTimeout ->
      fireStack.push '3rd'
      next null, '3rd'
    , 50
], (error, result) ->
  # result     --- ['1st', '2nd', '3rd']
  # fire_stack --- ['3rd', '1st', '2nd']
```

<a name="order"/>
## pp.order(procs, callback, [timeSlice])

### Arguments
* procs: Array.&lt;Iterator&gt; task procedure list
* callback(?Error, Array) callback procedure
* timeSlice - **optional** time slice for iteration loop.

### Example
```coffeescript
fireStack = []

pp.order [
  (next) ->
    setTimeout ->
      fireStack.push '1st'
      next null, '1st'
    , 100
  , (next) ->
    setTimeout ->
      fireStack.push '2nd'
      next null, '2nd'
    , 200
  , (next) ->
    setTimeout ->
      fireStack.push '3rd'
      next null, '3rd'
    , 50
], (error, result) ->
  # result     --- ['1st', '2nd', '3rd']
  # fire_stack --- ['1st', '2nd', '3rd']
```

