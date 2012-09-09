contexts.extend do ->
  arrayEachStepBy = (isShouldStep) ->
    cpsEach = (iterator, callback, array) ->
      limit = array.length
      return callback null if limit < 1

      index = count = 0
      finished = no

      next = (error, args...) ->
        ++count
        return if finished
        if count >= limit or error or args.length
          finished = yes
          args.unshift error or null
          callback.apply null, args
        return

      main = ->
        return if finished
        if isShouldStep index, limit, count
          iterator next, array[index], index, array
          ++index
        main

  hashEachBy = (eachProc) ->
    cpsEach  = (iterator, callback, hash) ->
      hashIterator = (next, key, index, keys) ->
        iterator next, hash[key], key, hash
        return
      eachProc hashIterator, callback, __.keys hash

  toLimit      = (index, limit) -> index < limit
  waitCallback = (index, limit, count) -> index < limit and index <= count

  mixin = contexts._iteratorMixin
  fill  = arrayEachStepBy toLimit
  order = arrayEachStepBy waitCallback

  _arrayEachFill:  fill
  _arrayEachOrder: order
  each:            mixin 'pp#each', fill, hashEachBy fill
  eachOrder:       mixin 'pp#eachOrder', order, hashEachBy order
