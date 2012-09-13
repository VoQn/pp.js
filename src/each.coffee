pp.extend (util) ->
  stepBy = (step) ->
    arrayForEach = (iterator, callback, array) ->
      return callback null unless array.length

      index = count = 0
      finished = some = no
      next = (error) ->
        return if finished
        if error or 1 < arguments.length or ++count >= array.length
          some = util.slice.call arguments
          some[0] = error or null
        return
      main = ->
        return if finished
        if step index, array.length, count
          iterator next, array[index], index, array
          ++index
        if some
          finished = yes
          callback.apply null, some
        main

  forEach =
    fill: stepBy (index, limit) ->
      index < limit
    order: stepBy (index, limit, count) ->
      index is count and index < limit
    array: (type) ->
      @[type]
    hash: (type) ->
      hashForEach = (iterator, callback, hash) ->
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
