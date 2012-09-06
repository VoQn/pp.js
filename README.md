# pp.js - pianissimo -

[![Build Status](https://secure.travis-ci.org/VoQn/pp.js.png)](http://travis-ci.org/VoQn/pp.js)

__pp.js__ calls __pianissimo.js__, meaning _Pseudo-Parallel_, _Passing-Procedure_, _Pretty-Promise_.
pp.js is javascript library for Asynchronous Collection &amp; Procedure Control Flow.

this library inspired by [async.js](https://github.com/caolan/async), [JsDeferred](http://cho45.stfuawsc.com/jsdeferred/), [$.Deferred](http://api.jquery.com/category/deferred-object/), [Promise/A](http://wiki.commonjs.org/wiki/Promises/A).
And aiming provide compatible API.

for read this library specification see [Guide](#guide), [Reference](#reference)

## License
MIT License. see LICENSE file.

## API

### Continuation Object
These function create instance of `Promise` and `Generator` that controller
about Asynchonouse routine.

+ [pp.promise](#promise) - Implement [Promise/A](http://wiki.commonjs.org/wiki/Promises/A) of [CommonJS](http://www.commonjs.org/)
+ [pp.generator](#generator) - simple [Generator](http://wiki.ecmascript.org/doku.php?id=harmony:generators) like [ES-Harmony](https://mail.mozilla.org/pipermail/es-discuss/2008-August/006837.html)

### Control Flow against Array as procedures
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

### Collection API
These API are very similar to functions of async.js.
But here is different argument rule, never blocking user thread, never occuring
`Stack Over Flow`, faster (x 1.5 ~ 2.0), and use less heap memory (x ~0.5).

+ [pp.each](#each) - like [async.forEach](https://github.com/caolan/async#forEach), [async.forEachLimit](https://github.com/caolan/async#forEach)
+ [pp.map](#map) - like [async.map](https://github.com/caolan/async#map)
+ [pp.filter](#filter) - like
  [async.filter](https://github.com/caolan/async#filter)
+ [pp.reject](#reject) - like
  [async.reject](https://github.com/caolan/async#reject)
+ [pp.find](#find) - like [async.detect](https://github.com/caolan/async#detect)
+ [pp.any](#any) - like [async.some](https://github.com/caolan/async#some)
+ [pp.all](#all) - like [async.every](https://github.com/caolan/async#every)
+ [pp.foldl](#foldl) - like [async.reduce](https://github.com/caolan/async#reduce)
+ [pp.foldr](#foldr) - like
  [async.redureRight](https://github.com/caolan/async#reduce)

### Plugin Extention Interface, and Etc...

+ [pp.extend](#extend) if want to add extention, call this.
+ [pp.defer](#defer) deferring (use `process.nextTick` (node.js) or
  `setTimeout(fn, 0, args...)`)
+ [pp.TIME\_SLICE](#timeslice) preset parameters X fps (ms)
+ [pp.noConflict](#noconflict)

-------------------------------------------------------------------------------

<a name="guide"/>
# Guide
## CPS (Continuation Passing Style)
__pp.js__ is designed by CPS, _Continuation Passing Style_, for effective Asynchronous
processing.

## Trampolining, "Pseudo-Parallel"
__pp.js__ doesn't provide _true_ parallel processing. Parallel processing is a strictly pseudo.
This pseudo-parallel processing on [Trampoling](http://en.wikipedia.org/wiki/Trampoline\_\(computing\)).

## Public API are curried
__pp.js__ API are curried function.

For example, CPS sum of number array is this.

```javascript
var printSum = pp.foldl(function(next, memo, value) {
  if(typeof value !== 'number') {
    next(new TypeError('"folding" require number, but ' + typeof value));
  } else {
    next(null, memo + value);
  }
}, function(error, result) {
  console.log(result);
}, 0); // See it! subject array has not apply!

printSum([10, 11, 12]); //=> 33
printSum([1, 2, 3, 4, 5]) //=> 15
```

## Invocation type of callback, "fill" and "order"
In designing Asynchronous operetion, maybe occur a problem that dependency with
each procedures.

Because solve it, pp.js provide two iteration. _fill_ and _order_.

### fill
`fill` process is ASAP (As Soon As Possible)

```javascript
fireStack = [];

pp.fill([
  function(next) {
    setTimeout(function() {
      fireStack.push('1st');
      next(null, '1st');
    }, 100);
  }, function(next) {
    setTimeout(function() {
      fireStack.push('2nd');
      next(null, '2nd');
    }, 200);
  }, function(next) {
    setTimeout(function() {
      fireStack.push('3rd');
      next(null, '3rd');
    }, 50)
  }], function(error, result) {
    // result     --- ['1st', '2nd', '3rd']
    // fire_stack --- ['3rd', '1st', '2nd']
  });
```

### order
`order` process is keep invocation order.

```javascript
fireStack = [];

pp.order([
  function(next) {
    setTimeout(function() {
      fireStack.push('1st');
      next(null, '1st');
    }, 100);
  }, function(next) {
    setTimeout(function() {
      fireStack.push('2nd');
      next(null, '2nd');
    }, 200);
  }, function(next) {
    setTimeout(function() {
      fireStack.push('3rd');
      next(null, '3rd');
    }, 50)
  }], function(error, result) {
    // result     --- ['1st', '2nd', '3rd']
    // fire_stack --- ['1st', '2nd', '3rd']
  });
```

## Type
A difference between __pp.js__ with __async.js__ is consisting argument format.

### TimeSlice: number

`pp.TIME_SLICE` provide consts for frame rate.

+ FPS\_240 -  4ms
+ FPS\_120 -  8ms
+ FPS\_60  - 16ms
+ FPS\_30  - 33ms
+ FPS\_15  - 66ms
+ FPS\_1   -  1s (1000ms)

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

```javascript
var cpsIsEven = function(next, value) {
  next(null, value % 2 === 0);
};
```

-------------------------------------------------------------------------------

### Accumulator: function(callback, memo, value, [key, iterable])
__pp.js__ defined __Folding__ type that is `function(callback, memo, value, [key, iterable])`.

for accumulate array list.

#### Example

```javascript
var cpsAdd = function(next, memo, value) {
  next(null, memo + value);
};
```

-------------------------------------------------------------------------------

### Callback: function(?Error, [somethings...])
__pp.js__ defined __Callback__ type that is `function(Error, [somethings...])`.

first argument, received Error, is accepted as __nullable__.

-------------------------------------------------------------------------------

### Iterable: (!Array | !Object as {string: any})
__pp.js__ defined __Iterable__ type that is __not null__ Array or Object.

primitive values ... `undefined`, `null`, `string`, `boolean` and `number` aren't accepted.

-------------------------------------------------------------------------------

<a name="reference"/>
# Referrence

__|||documentation writing now...|||__

## Control Flow
<a name="iterator"/>
### pp.iterator(procs)

#### Arguments
* procs: Array.<function(any...)> - procedure list

#### Example

```javascript
var current = '',
  iter = pp.iterator([
    function() {
      current = '1st';
    },
    function() {
      current = '2nd';
    },
    function() {
      current = '3rd';
    }
  ]);

iter2 = iter();
console.log(current); // '1st'

iter3 = iter2();
console.log(current); // '2nd'

iter3()
console.log(current); // '3rd'

iter4 = iter.next();
iter4();
console.log(current); // '2nd'
```

-------------------------------------------------------------------------------

<a name="waterfall"/>
### pp.waterfall(procs, [callback])

#### Arguments
* procs {Array.&lt;Iterator&gt;} - procedure list
* callback(error, results...) - callback after iteration

#### Example
```javascript
pp.waterfall([
  function(next) {
    next(null, 1);
  },
  function(next, v) {
    next(null, v, v * 2); // v:1
  },
  function(next, v1, v2);
    next(null, v1 + v2); // {v1: 1, v2: 2}
  }
], function(error, result) {
  console.log(error === null); // true
  console.log(result); // 3
});
```

-------------------------------------------------------------------------------

<a name="whilist"/>
### pp.whilist(predicator, iterator, callback, [init])

-------------------------------------------------------------------------------

<a name="until"/>
### pp.until(predicator, iterator, callback, [init])

-------------------------------------------------------------------------------

<a name="fill"/>
### pp.fill(procs, [callback])

#### Example
```javascript
fireStack = [];

pp.fill([
  function(next) {
    setTimeout(function() {
      fireStack.push('1st');
      next(null, '1st');
    }, 100);
  }, function(next) {
    setTimeout(function() {
      fireStack.push('2nd');
      next(null, '2nd');
    }, 200);
  }, function(next) {
    setTimeout(function() {
      fireStack.push('3rd');
      next(null, '3rd');
    }, 50)
  }], function(error, result) {
    // result     --- ['1st', '2nd', '3rd']
    // fire_stack --- ['3rd', '1st', '2nd']
  });
```

-------------------------------------------------------------------------------

<a name="order"/>
### pp.order(procs, [callback])

#### Example
```javascript
fireStack = [];

pp.order([
  function(next) {
    setTimeout(function() {
      fireStack.push('1st');
      next(null, '1st');
    }, 100);
  }, function(next) {
    setTimeout(function() {
      fireStack.push('2nd');
      next(null, '2nd');
    }, 200);
  }, function(next) {
    setTimeout(function() {
      fireStack.push('3rd');
      next(null, '3rd');
    }, 50)
  }], function(error, result) {
    // result     --- ['1st', '2nd', '3rd']
    // fire_stack --- ['1st', '2nd', '3rd']
  });
```

-------------------------------------------------------------------------------

## Collection API
<a name="each"/>
### pp.each(iterator, callback, iterable, [timeSlice])

#### Arguments

* iterator(callback, [value, index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* iterable - **not Nullable** Array or Object as HashMap (`{{string: *}}`)
* timeSlice - **optional** time slice for iteration loop.

#### Example

```javascript
pp.each(function(next, value, index, itrable) {
    // do something
    if (errorCondition) {
      // when it should throw Error, instead of call
      next(error);
    } else if (haltCondition) {
      // when it should halt iteration (purpose has been achieved)
      next(null, result);
    } else { // call iteration callback simply
      next();
    }
  }, function(error) {
    // do something when finish (or halt) iteration
  }, ['a.coffee', 'b.coffee', 'c.coffee']);
```

<a name="eachOrder"/>
### pp.eachOrder(iterator, callback, iterable, [timeSlice])
`pp.eachOrder` is another version of `pp.each` that keep invocation callback order.

-------------------------------------------------------------------------------

<a name="map"/>
### pp.map(iterator, callback, iterable, [timeSlice])

#### Arguments

* iterator(callback, [value, index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* iterable - **not Nullable** Array or Object as HashMap (`{{string: *}}`)
* timeSlice - **optional** time slice for iteration loop.

#### Example

```javascript
var cpsSqMap = pp.map(function(next, value, index) {
  if (typeof value !== 'number') {
    next(new TypeError('cpsSqMap require number array. but include' +
      typeof value + ' (' + value + ') at [' + index + ']'));
  } else {
    next(null, value * value);
  });

cpsSqMap(console.log, [1, 2, 3, 4, 5]);
//=> null [1, 4, 9, 16, 25]

cpsSqMap(console.log, [1, 2, '3', 4, 5]);
//=> [TypeError: cpsSqMap require number array. but include string (3) at [2]] [ 1, 4 ]
```

<a name="mapOrder"/>
### pp.mapOrder(iterator, callback, iterable, [timeSlice])
`pp.mapOrder` is another version of `pp.each` that keep invocation callback order.

-------------------------------------------------------------------------------

<a name="filter"/>
### pp.filter(predicator, callback, array, [timeSlice])
`pp.filter`'s invocation is _order_

#### Arguments

* predicator(callback, [value, index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* array - **not Nullable** Array
* timeSlice - **optional** time slice for iteration loop.

#### Example

```javascript
var cpsOdd = function(next, value) {
  if (typeof value !== 'number') {
    next(new TypeError('cpsOdd require number array. but include' +
      typeof value + ' (' + value + ') at [' + index + ']'));
  } else {
    next(null, value % 2 === 1); // apply 2nd arg as boolean
  }
};

var printCallback = function(error, results) {
  console.log(error ? error.message : results);
};

pp.filter(cpsOdd, printCallback, [1, 2, 3, 4, 5]);
//=> [1, 3, 5]
pp.filter(cpsOdd, printCallback, [2, 4, 6, 8, 10]);
//=> []
```

-------------------------------------------------------------------------------

<a name="reject"/>
### pp.reject(predicator, callback, array, [timeSlice])
complement of `pp.filter`

#### Arguments

* predicator(callback, [value, index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* array - **not Nullable** Array
* timeSlice - **optional** time slice for iteration loop.

#### Example

```javascript
pp.reject(cpsOdd, printCallback, [1, 2, 3, 4, 5]);
//=> [2, 4]
pp.reject(cpsOdd, printCallback, [10, 12, 14, 16, 18]);
//=> [10, 12, 14, 16, 18]
```

-------------------------------------------------------------------------------

<a name="find"/>
### pp.find(predicator, callback, iterable, [timeSlice])
lookup match value from iterable.

#### Arguments

* predicator(callback, [value, index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* iterable - **not Nullable** Array or Object as HashMap (`{{string: *}}`)
* timeSlice - **optional** time slice for iteration loop.

#### Example

```javascript
pp.find(cpsOdd, printCallback, [1, 2, 3, 4, 5]);
//=> 1
pp.find(cpsOdd, printCallback, [10, 12, 14, 16, 18]);
//=> undefined
```

-------------------------------------------------------------------------------

<a name="any"/>
### pp.any(predicator, callback, iterable, [timeSlice])
`pp.any` is CPS `Array.some`

#### Arguments

* predicator(callback, [value, index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* iterable - **not Nullable** Array or Object as HashMap (`{{string: *}}`)
* timeSlice - **optional** time slice for iteration loop.

#### Example

```javascript
pp.any(cpsOdd, printCallback, [0, 2, 5, 8, 10])
//=> true
pp.any(cpsOdd, printCallback, [2, 4, 6, 8, 10])
//=> false
```

-------------------------------------------------------------------------------

<a name="all"/>
### pp.all(predicator, callback, iterable, [timeSlice])
`pp.all` is CPS `Array.every`

#### Arguments

* predicator(callback, [value, index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* iterable - **not Nullable** Array or Object as HashMap (`{{string: *}}`)
* timeSlice - **optional** time slice for iteration loop.

#### Example

```javascript
pp.all(cpsOdd, printCallback, [1, 3, 6, 7, 9])
//=> false
pp.all(cpsOdd, printCallback, [1, 3, 5, 7, 9])
//=> true
```

-------------------------------------------------------------------------------

<a name="foldl"/>
### pp.foldl(accumulator, callback, init, array, [timeSlice])
folding accumulation left(first of array) to right(last of array).

`pp.foldl`'s invocation is _order_

#### Arguments

* accumulator(callback, memo, value, [index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* init - init value for accumulation
* array - **not Nullable** Array
* timeSlice - **optional** time slice for iteration loop.

#### Example
```javascript
pp.foldl(function(next, r, x) {
  next(null, r + x);
}, function(error, result) {
  console.log(result);  // => 15
}, 0, [1, 2, 3, 4, 5]); // 0 + 1 + 2 + 3 + 4 + 5 => 15
```

-------------------------------------------------------------------------------

<a name="foldl1"/>
### pp.foldl1(accumulator, callback, array, [timeSlice])
`pp.foldl1` require Array has 1 or more length. use first element from Array as `init` value.

#### Arguments

* accumulator(callback, memo, value, [index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* array - **not Nullable** Array
* timeSlice - **optional** time slice for iteration loop.

#### Example

```javascript
pp.foldl1(function(next, r, x) {
  next(null, r + x);
}, function(error, result) {
  console.log(result); // => 15
}, [1, 2, 3, 4, 5]);   // 1 + 2 + 3 + 4 + 5 => 15

pp.foldl1(function(next, r, x) {
  next(null, r + x);
}, function(error, result) {
  console.log(error); // => TypeError
}, []); // empty array :^(
```

-------------------------------------------------------------------------------

<a name="foldr"/>
### pp.foldr(accumulator, callback, init, array, [timeSlice])
folding accumulation right(last of array) to left(first of array).

`pp.foldl`'s invocation is _order_

#### Arguments

* accumulator(callback, memo, value, [index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* init - init value for accumulation
* array - **not Nullable** Array
* timeSlice - **optional** time slice for iteration loop.

#### Example

```javascript
pp.foldr(function(next, r, x) {
  next(null, r + x);
}, function(error, result) {
  console.log(result);  // => 15
}, 0, [1, 2, 3, 4, 5]); // 0 + 5 + 4 + 3 + 2 + 1 => 15
```

-------------------------------------------------------------------------------

<a name="foldr1"/>
### pp.foldr1(accumulator, callback, array, [timeSlice])
`pp.foldr1` require Array has 1 or more length. use last element from Array as `init` value.

#### Arguments

* accumulator(callback, memo, value, [index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* array - **not Nullable** Array
* timeSlice - **optional** time slice for iteration loop.

#### Example

```javascript
pp.foldr1(function(next, r, x) {
  next(null, r + x);
}, function(error, result) {
  console.log(result); // => 15
}, [1, 2, 3, 4, 5]);   // 5 + 4 + 3 + 2 + 1 => 15
```

