# Collection API
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

<a name="each"/>
## pp.each(iterator, callback, iterable, [timeSlice])

### Arguments

* iterator(callback, [value, key, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* iterable - **not Nullable** Array or Object as HashTable (`{{string: *}}`)
* timeSlice - **optional** time slice for iteration loop.

### Example

```coffeescript
pp.each (next, value, index, itrable) ->
  # do something
  if errorCondition
    # when it should throw Error, instead of call
    next new Error "error"
  else if haltCondition
    # when it should halt iteration (purpose has been achieved)
    next(null, result);
  else # call iteration callback simply
    next()
, (error) ->
  # do something when finish (or halt) iteration
, ['a.coffee', 'b.coffee', 'c.coffee']
```

<a name="eachOrder"/>
## pp.eachOrder(iterator, callback, iterable, [timeSlice])
`pp.eachOrder` is another version of `pp.each` that keep invocation callback order.

<a name="map"/>
## pp.map(iterator, callback, iterable, [timeSlice])

### Arguments

* iterator(callback, [value, index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* iterable - **not Nullable** Array or Object as HashTable (`{{string: *}}`)
* timeSlice - **optional** time slice for iteration loop.

### Example

```coffeescript
cpsSqMap = pp.map (next, value, index) ->
  if  typeof value isnt 'number'
    next new TypeError "cpsSqMap require number array.
     but include #{typeof value} (#{value}) at [#{index}]"
  else
    next null, value * value

cpsSqMap console.log, [1, 2, 3, 4, 5] #=> null [1, 4, 9, 16, 25]

cpsSqMap console.log, [1, 2, '3', 4, 5]
#=> [TypeError: cpsSqMap require number array. but include string (3) at [2]] [ 1, 4 ]
```

<a name="mapOrder"/>
## pp.mapOrder(iterator, callback, iterable, [timeSlice])
`pp.mapOrder` is another version of `pp.each` that keep invocation callback order.

<a name="filter"/>
## pp.filter(predicator, callback, iterable, [timeSlice])
`pp.filter`'s invocation is _order_

### Arguments

* predicator(callback, [value, index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* iterable - **not Nullable** Array or Object as HashTable (`{{string: *}}`)
* timeSlice - **optional** time slice for iteration loop.

### Example

```coffeescript
cpsOdd = (next, value) ->
  if typeof value isnt 'number'
    next new TypeError "cpsOdd require number array. but include
     #{typeof value} (#{value}) at [#{index}]"
  else
    next null, value % 2 is 1 # apply 2nd arg as boolean

printCallback = (error, results) ->
  console.log if error then error.message else results

pp.filter cpsOdd, printCallback, [1, 2, 3, 4, 5]
#=> [1, 3, 5]

pp.filter cpsOdd, printCallback, [2, 4, 6, 8, 10]
#=> []

cpsPrivate = (next, value, key) ->
  next null, key.match /^_/

# filtering to hash table
pp.filter cpsPrivate, printCallback,
  name: 'John'
  age: 26
  gender: MALE
  _hasGirlFriend: yes
#=> "{_hasGirlFriend: true}" (o_O)
```

<a name="reject"/>
## pp.reject(predicator, callback, iterable, [timeSlice])
complement of `pp.filter`

### Arguments

* predicator(callback, [value, index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* iterable - **not Nullable** Array or Object as HashTable (`{{string: *}}`)
* timeSlice - **optional** time slice for iteration loop.

### Example

```coffeescript
pp.reject cpsOdd, printCallback, [1, 2, 3, 4, 5]
#=> [2, 4]

pp.reject cpsOdd, printCallback, [10, 12, 14, 16, 18]
#=> [10, 12, 14, 16, 18]

# filtering to hashtable
pp.reject cpsPrivate, printCallback,
  name: 'John'
  age: 26
  gender: MALE
  _hasGirlFriend: yes
#=> "{name: 'John', age: 26, gender: "male"}" (-_-)
```

<a name="find"/>
## pp.find(predicator, callback, iterable, [timeSlice])
lookup match value from iterable.

### Arguments

* predicator(callback, [value, key, iterable]) - iteration procedure
* callback(error, [value, key]) - callback for after iteration
* iterable - **not Nullable** Array or Object as HashTable (`{{string: *}}`)
* timeSlice - **optional** time slice for iteration loop.

### Example

```coffeescript
pp.find cpsOdd, printCallback, [1, 2, 3, 4, 5]
#=> 1

pp.find cpsOdd, printCallback, [10, 12, 14, 16, 18]
#=> undefined

pp.find (next, value, key) ->
  next null, key.match /^#[a-zA-Z0-9]/
, (error, value, key) ->
  console.log "value: #{value}, key: #{key}"
, # js Object as CSS
  body:
    width: '100%'
  '#container':
    'background-color': '#eee'
  '.notice':
    color: '#000'
#=>value: {'background-color': '#eee'} key: '#container'
```

<a name="any"/>
## pp.any(predicator, callback, iterable, [timeSlice])
`pp.any` is CPS `Array.some`

### Arguments

* predicator(callback, [value, index, iterable]) - iteration procedure
* callback(error, bool, [key]) - callback for after iteration
* iterable - **not Nullable** Array or Object as HashTable (`{{string: *}}`)
* timeSlice - **optional** time slice for iteration loop.

### Example

```coffeescript
pp.any cpsOdd, printCallback, [0, 2, 5, 8, 10]
#=> true
pp.any cpsOdd, printCallback, [2, 4, 6, 8, 10]
#=> false
```

<a name="all"/>
## pp.all(predicator, callback, iterable, [timeSlice])
`pp.all` is CPS `Array.every`

### Arguments

* predicator(callback, [value, index, iterable]) - iteration procedure
* callback(error, bool, [key]) - callback for after iteration
* iterable - **not Nullable** Array or Object as HashTable (`{{string: *}}`)
* timeSlice - **optional** time slice for iteration loop.

### Example

```coffeescript
pp.all cpsOdd, printCallback, [1, 3, 6, 7, 9]
#=> false
pp.all cpsOdd, printCallback, [1, 3, 5, 7, 9]
#=> true
```

<a name="foldl"/>
## pp.foldl(accumulator, callback, init, array, [timeSlice])
folding accumulation left(first of array) to right(last of array).

`pp.foldl`'s invocation is _order_

### Arguments

* accumulator(callback, memo, value, [index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* init - init value for accumulation
* array - **not Nullable** Array
* timeSlice - **optional** time slice for iteration loop.

### Example
```coffeescript
pp.foldl (next, r, x) ->
  next null, r + x
, (error, result) ->
  console.log result # => 15
, 0, [1, 2, 3, 4, 5] # 0 + 1 + 2 + 3 + 4 + 5 => 15
```

<a name="foldl1"/>
## pp.foldl1(accumulator, callback, array, [timeSlice])
`pp.foldl1` require Array has 1 or more length. use first element from Array as `init` value.

### Arguments

* accumulator(callback, memo, value, [index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* array - **not Nullable** Array
* timeSlice - **optional** time slice for iteration loop.

### Example

```coffeescript
pp.foldl1 (next, r, x) ->
  next null, r + x
, (error, result) ->
  console.log result # => 15
, [1, 2, 3, 4, 5] # 1 + 2 + 3 + 4 + 5 => 15

pp.foldl1 (next, r, x) ->
  next null, r + x
, (error, result) ->
  console.log error # => TypeError
, [] # empty array :^(
```

<a name="foldr"/>
## pp.foldr(accumulator, callback, init, array, [timeSlice])
folding accumulation right(last of array) to left(first of array).

`pp.foldl`'s invocation is _order_

### Arguments

* accumulator(callback, memo, value, [index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* init - init value for accumulation
* array - **not Nullable** Array
* timeSlice - **optional** time slice for iteration loop.

### Example

```coffeescript
pp.foldr (next, r, x) ->
  next null, r + x
, (error, result) ->
  console.log result # => 15
, 0, [1, 2, 3, 4, 5] # 0 + 5 + 4 + 3 + 2 + 1 => 15
```

<a name="foldr1"/>
## pp.foldr1(accumulator, callback, array, [timeSlice])
`pp.foldr1` require Array has 1 or more length. use last element from Array as `init` value.

### Arguments

* accumulator(callback, memo, value, [index, iterable]) - iteration procedure
* callback(error, [somethings...]) - callback for after iteration
* array - **not Nullable** Array
* timeSlice - **optional** time slice for iteration loop.

### Example

```coffeescript
pp.foldr1 (next, r, x) ->
  next null, r + x
, (error, result) ->
  console.log result # => 15
, [1, 2, 3, 4, 5]   # 5 + 4 + 3 + 2 + 1 => 15
```

