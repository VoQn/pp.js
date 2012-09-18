pp.extend (util) ->
  stepBy = (isReady) ->
    arrayForEach = (iterator, callback, array) ->
      return callback null unless array.length

      index = count = 0
      finished = no

      next = (error) ->
        return if finished
        if error or 1 < arguments.length or ++count >= array.length
          finished = yes
          args = util.slice.call arguments
          args[0] = error or null
          callback.apply null, args
        return

      main = () ->
        return if finished
        if isReady index, array.length, count
          iterator next, array[index], index, array
          ++index
        main

  forEach =
    fill: stepBy (index, limit) ->
      index < limit
    order: stepBy (index, limit, count) ->
      index is count and index < limit
    array: (type) ->
      @[type]
    hash: (type) ->
      return @hash[type] if @hash[type]
      @hash[type] = (iterator, callback, hash) ->
        hashIterator = (next, key) ->
          iterator next, hash[key], key, hash
          return
        forEach[type] hashIterator, callback, util.keys hash
    mixin: (name, type) ->
      util.iteratorMixin name, @array(type), @hash(type)

  util.trampolines
    _forEach:  forEach
    each:      forEach.mixin 'pp#each',      'fill'
    eachOrder: forEach.mixin 'pp#eachOrder', 'order'
