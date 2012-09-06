__.extend.call metaContext,
  arrayEachStepBy: (isShouldStep) ->
    makeProc = (iterator, callback, array) ->
      LIMIT = array.length

      if LIMIT < 1
        callback null
        return

      count = 0
      finished = no

      next = (error) ->
        ++count
        if not finished and (count >= LIMIT or error or arguments.length > 1)
          finished = yes
          args = if 2 < arguments.length then [] else __.slice.call arguments, 1
          args.unshift error or null
          callback.apply null, args
          return

      main = pp.context
        func: (after, value, index, iterable) ->
          return if finished
          if isShouldStep index, LIMIT, count
            iterator after, value, index, iterable
            main.args[1] = iterable[index + 1]
            main.args[2] = index + 1
          main
        args: [next, array[0], 0, array]
        scope: array

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
