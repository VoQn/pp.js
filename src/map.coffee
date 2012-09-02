__.extend.call metaContext,
  arrayMapBy: (eachProc) ->
    makeProc = (iterator, callback, array) ->
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

  hashMapBy: (eachProc) ->
    makeProc = (iterator, callback, hash) ->
      modified  = __.inherit hash
      putResult = null

      mapping = (next, key, index, keys) ->
        putResult = (error, result) ->
          modified[key] = result
          next error
          return
        iterator putResult, hash[key], key, hash
        return

      after = (error) ->
        callback error, modified
        return

      eachProc mapping, after, __.keys hash

contexts.extend do ->
  meta     = metaContext
  mixin    = meta.iteratorMixin
  arrayMap = meta.arrayMapBy
  hashMap  = meta.hashMapBy
  fill     = contexts._arrayEachFill
  order    = contexts._arrayEachOrder

  map:      mixin 'pp#map',      arrayMap(fill),  hashMap(fill)
  mapOrder: mixin 'pp#mapOrder', arrayMap(order), hashMap(order)
