# pp.js - pianissimo -

[![Build Status](https://secure.travis-ci.org/VoQn/pp.js.png)](http://travis-ci.org/VoQn/pp.js)

__pp.js__ is called __pianissimo.js__, which means _Pseudo-Parallel_, _Passing-Procedure_, or _Pretty-Promise_.
pp.js is a javascript library for Asynchronous Collection &amp; Procedure Control Flow.

this library is inspired by [async.js](https://github.com/caolan/async), [JsDeferred](http://cho45.stfuawsc.com/jsdeferred/), [$.Deferred](http://api.jquery.com/category/deferred-object/), and [Promise/A](http://wiki.commonjs.org/wiki/Promises/A).
And aiming provide compatible API.

to read this library specification see [Guide](#guide), [Reference](#reference)

## Faster, Fewer Cost, Parallel multi process

![Benchmark pp.js vs async.js](https://lh4.googleusercontent.com/-N_dY3EUza5A/UE_932DxeBI/AAAAAAAAAlk/BoI8v5z7r00/s874/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88+2012-09-12+12.12.36.png)

+ pp.js faster than async.js (more than 1.25x)
+ pp.js use fewer memory async.js (lower than 1/3)
+ pp.js work looks like parallel (see [Guide/Trampolining](#trampolining))
+ while running pp.js process, It does not block user control as possible as.

## License
Copyright (c) 2012 VoQn

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

<a name="reference"/>
## API Reference

+ [Utilities](/VoQn/pp.js/blob/master/doc/utilities.md)
+ [Promise/A](/VoQn/pp.js/blob/master/doc/promise.md) - Implement [Promise/A](http://wiki.commonjs.org/wiki/Promises/A) of [CommonJS](http://www.commonjs.org/)
+ [Generator](/VoQn/pp.js/blob/master/doc/generator.md) - simple [Generator](http://wiki.ecmascript.org/doku.php?id=harmony:generators) like [ES-Harmony](https://mail.mozilla.org/pipermail/es-discuss/2008-August/006837.html)
+ [Control Flow API](/VoQn/pp.js/blob/master/doc/control_flow_api.md)
+ [Collection API](/VoQn/pp.js/master/doc/collection_api.md)

<a name="guide"/>
# Guide
## CPS (Continuation Passing Style)
__pp.js__ is designed by [CPS](http://en.wikipedia.org/wiki/Continuation-passing_style), _Continuation Passing Style_, for effective Asynchronous processing.

```coffeescript
# sync procedure
sq = (x) ->
  x * x

console.log sq 10 # return 10 * 10 -> 100 -> console.log(100) => IO output

# CPS procedure
cpsSq = (next, x) ->
  next x * x

cpsSq console.log, 10 # console.log(10 * 10) -> console.log(100) => IO output

# Async procedure
heavyProcessing = (callback, parameters) ->
  # do something (use long time, or network communication)
  # ...
  # ...
  callback error, result # when process done, result apply asynchronouse

heavyProcessing (e, r) -> # callback
  if e # receive error
    # do something
  else # process has been succeeded
    # do something
, [### parameters ###]
```

<a name="trampolining"/>
## Trampolining, "Pseudo-Parallel"
__pp.js__ doesn't provide _true_ parallel processing. Parallel processing is a strictly pseudo.
This pseudo-parallel processing on [Trampoling](http://en.wikipedia.org/wiki/Trampoline\_\(computing\)).

## Public API are curried
__pp.js__ API are curried function.

For example, CPS sum of number array is this.

```coffeescript
printSum = pp.foldl (next, memo, value) ->
  if typeof value isnt 'number'
    next new TypeError "\"folding\" require number, but #{typeof value}"
  else
    next null, memo + value
  return
, (error, result) ->
  console.log result
, 0 # See it! subject array has not apply!

printSum [10, 11, 12] #=> 33
printSum [1, 2, 3, 4, 5] #=> 15
```

## Invocation type of callback, "fill" and "order"
In designing Asynchronous operetion, maybe occur a problem that dependency with
each procedures.

Because solve it, pp.js provide two iteration. _fill_ and _order_.

### fill
`fill` process is ASAP (As Soon As Possible)

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

### order
`order` process is keep invocation order.

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

### Difference?

``` coffeescript
pp.fill F, G, H, CALLBACK
# eval F -> eval G -> eval H -> (wait callback...) -> eval CALLBACK

pp.order F, G, H, CALLBACK
# eval F -> (wait F callback...) -> eval G -> (wait G callback...) -> ...
```

Why `pp.fill`'s name is _parallel_ but _fill_? Because it run all procedures and wait until all callback is filling.

`pp.order` is keeping its ordering. When it began run procedure, wait that callback, run next procedure. Until last.

## Type
One of difference between __pp.js__ with __async.js__ is consisted argument format.

### TimeSlice: number (integer milli-second [0 &lt; t])

`pp.TIME_SLICE` provide consts for frame rate.

+ FPS\_240 -  4ms
+ FPS\_120 -  8ms
+ FPS\_60  - 16ms
+ FPS\_30  - 33ms
+ FPS\_15  - 66ms
+ FPS\_1   -  1s (1000ms)

-------------------------------------------------------------------------------

### Callback: function(?Error, [somethings...])
__pp.js__ defined __Callback__ type that is `function(Error, [somethings...])`.

first argument, received Error, is accepted as __nullable__.

-------------------------------------------------------------------------------

### Iterable: (!Array | !Object as {string: any})
__pp.js__ defined __Iterable__ type that is __not null__ Array or Object.

primitive values ... `undefined`, `null`, `string`, `boolean` and `number` aren't accepted.

-------------------------------------------------------------------------------

### Iterator: function(callback, [somethings...])
__pp.js__ defined __Iterator__ type that is `function(callback, [somethings...])` 

For example, available iterator for Array

+ `function(function:next, any:value, number:index, array:iterable)`
+ `function(function:next, any:value, number:index)`
+ `function(function:next, any:value)`
+ `function(function:next)`

for Object,
+ `function(function:next, any:value, string:key, object:iterable)`
+ `function(function:next, any:value, string:key)`
+ `function(function:next, any:value)`
+ `function(function:next)`

iterator type need continuation function for 1st argument.

-------------------------------------------------------------------------------

### Predicator: function(callback, value, [key, iterable])
__pp.js__ defined __Predicator__ type that is `function(callback, value, [key, iterable])`

Specially, predicator passing `boolean` result to callback.

#### Example

```coffeescript
cpsIsEven = (next, value) ->
  next null, value % 2 is 0
```

-------------------------------------------------------------------------------

### Accumulator: function(callback, memo, value, [key, iterable])
__pp.js__ defined __Folding__ type that is `function(callback, memo, value, [key, iterable])`.

for accumulate array list.

#### Example

```coffeescript
cpsAdd = (next, memo, value) ->
  next null, memo + value
```

