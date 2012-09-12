pp.extend (util) ->
  arrayMapBy = (forEach) ->
    cpsMap = (iterator, callback, array) ->
      modified = []

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

      forEach mapping, after, array

  hashMapBy = (forEach) ->
    cpsMap = (iterator, callback, hash) ->
      modified  = util.inherit hash

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

      forEach mapping, after, util.keys hash

  mixin = util.iteratorMixin
  fill  = util.arrayEachFill
  order = util.arrayEachOrder

  util.trampolines
    map      : mixin 'pp#map',      arrayMapBy(fill),  hashMapBy fill
    mapOrder : mixin 'pp#mapOrder', arrayMapBy(order), hashMapBy order
