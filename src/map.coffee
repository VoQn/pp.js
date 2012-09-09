contexts.extend do ->
  arrayMapBy = (eachProc) ->
    cpsMap = (iterator, callback, array) ->
      modified   = []
      pushResult = null

      mapping = (next, value, index, iterable) ->
        pushResult = (error, result) ->
          modified[index] = result
          next error
          return
        iterator pushResult, value, index, iterable
        return

      after = (error) ->
        callback error, modified
        return

      eachProc mapping, after, array

  hashMapBy = (eachProc) ->
    cpsMap = (iterator, callback, hash) ->
      modified  = __.inherit hash
      putResult = null

      mapping = (next, key, index, keys) ->
        putResult = (error, result) ->
          modified[key] = result unless error
          next error
          return
        iterator putResult, hash[key], key, hash
        return

      after = (error) ->
        callback error, modified
        return

      eachProc mapping, after, __.keys hash

  mixin    = contexts._iteratorMixin
  fill     = contexts._arrayEachFill
  order    = contexts._arrayEachOrder

  map:      mixin 'pp#map',      arrayMapBy(fill),  hashMapBy fill
  mapOrder: mixin 'pp#mapOrder', arrayMapBy(order), hashMapBy order
