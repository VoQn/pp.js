pp.extend (util) ->
  forEachStepBy = (name, step) ->
    arrayForEach = (iterator, callback, array) ->
        limit = array.length
        return callback null unless limit

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
          if step index, limit, count
            iterator next, array[index], index, array
            ++index
          main

    hashForEach = (iterator, callback, hash) =>
        hashIterator = (next, key, index, keys) ->
          iterator next, hash[key], key, hash
          return
        arrayForEach hashIterator, callback, util.keys hash

    array: arrayForEach
    hash:  hashForEach
    mixin: util.iteratorMixin name, arrayForEach, hashForEach

  forEach =
    fill: forEachStepBy 'pp#each', toLimit = (index, limit) ->
      index < limit
    order: forEachStepBy 'pp#eachOrder', waitCallback = (index, limit, count) ->
      index < limit and index <= count

  util.trampolines
    _arrayEachFill:  forEach.fill.array
    _arrayEachOrder: forEach.order.array
    each:            forEach.fill.mixin
    eachOrder:       forEach.order.mixin
