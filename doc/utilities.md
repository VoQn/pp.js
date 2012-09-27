# Utilities

+ [pp.noConflict](#noconflict)
+ [pp.TIME\_SLICE](#timeslice) preset parameters X fps (ms)
+ [pp.defer](#defer) deferring (use `process.nextTick` (node.js) or
+ [pp.extend](#extend) if want to add extention, call this.
  `setTimeout(fn, 0, args...)`)

<a name="noconflict"/>
## pp.noConflict()
`pp.noConflict` is avoid conflict with already loaded `pp` symbol.

### Example
```html
<!-- not pp.js -->
<script type="text/coffee">
# pp - popup_pretty library
pp = do ->
  # something module definition
  # ...
</script>
<!-- pp.js --><script src="./script/pp.js"></script>
<script type="text/coffee">
_pp = pp.noConflict()
# pp = popup_pretty object
# _pp = pp.js object
</script>
```

<a name="timeslice"/>
## pp.TIME\_SLICE
`pp.TIME_SLICE` provide consts for frame rate.

+ FPS\_240 -  4ms
+ FPS\_120 -  8ms
+ FPS\_75  - 13ms
+ FPS\_60  - 16ms
+ FPS\_45  - 22ms
+ FPS\_30  - 33ms
+ FPS\_24  - 41ms
+ FPS\_15  - 66ms
+ FPS\_12  - 83ms
+ FPS\_10  - 100ms
+ FPS\_5   - 200ms
+ FPS\_2   - 500ms
+ FPS\_1   -  1s (1000ms)

<a name="defer"/>
## pp.defer(procedure)
`pp.defer` is so simple. deffering procedure.

### Like This
```coffeescript
deferUseProcess = (fn, args...) ->
  process.nextTick () ->
    fn.apply null, args
deferUseTimeout = (fn, args...) ->
  setTimeout () ->
    fn.apply null, args
  , 1

if typeof process isnt 'undefined' and typeof process.nextTick is 'function'
  pp.defer = deferUseProcess
else
  pp.defer = deferUseTimeout
```

<a name="extend"/>
## pp.extend(setup)

### Arguments

* setup {function(internal_util): Object} - setup of extention

### Example

```coffeescript
# ppfs.coffee
pp = require 'pp'
# pp filesystem extention
pp.extend (util) ->
  fs = require 'fs'

  # return Object {{ string: any }}

  # with underscore prefix to internal utilities
  _fs_read: (callback, filePath) ->
    fs.read filePath, callback

  # without underscore prefix to public interface
  read: (callback, files) ->
    pp.map util.fs_read, callback, if util.isArray files then files else [files]
```

```coffeescript
# usage
ppfs = require 'ppfs'

concatFileContent = (callback, files) ->
  ppfs.read (error, contents) ->
    callback error, contents.join '\n'
  , files

# Std Output concat multiple *.css files
concatFileContent console.log, ['a.css', 'b.css', 'c.css']
```
