__.extend.call metaContext,
  arrayEachStepBy: (isShouldStep) ->
    makeProc = (iterator, callback, array) ->
      LIMIT = array.length
      index = count = 0
      finished = no

      if LIMIT < 1
        callback null
        return

      next = (error) ->
        ++count
        return if finished
        if count >= LIMIT or error or arguments.length > 1
          finished = yes
          args = if 2 < arguments.length then [] else __.slice.call arguments, 1
          args.unshift error or null
          callback.apply null, args
        return

      main = ->
        return if finished
        if isShouldStep index, LIMIT, count
          iterator next, array[index], index, array
          ++index
        main

  hashEachBy: (eachProc) ->
    makeProc = (iterator, callback, hash) ->
      hashIterator = (next, key, index, keys) ->
        iterator next, hash[key], key, hash
        return
      eachProc hashIterator, callback, __.keys hash

contexts.extend do ->
  toLimit = (index, limit) ->
    index < limit

  waitCallback = (index, limit, count) ->
    index < limit and index <= count

  meta     = metaContext
  mixin    = meta.iteratorMixin
  hashEach = meta.hashEachBy
  fill     = meta.arrayEachStepBy toLimit
  order    = meta.arrayEachStepBy waitCallback

  _arrayEachFill:  fill
  _arrayEachOrder: order
  each:            mixin 'pp#each', fill, hashEach(fill)
  eachOrder:       mixin 'pp#eachOrder', order, hashEach(order)
