pp.extend (util) ->
  direction =
    left:
      name: 'pp#foldl'
      selectIndex: util.id
      getInit: 'shift'
    right:
      name: 'pp#foldr'
      selectIndex: (index, limit) ->
        limit - (index + 1)
      getInit: 'pop'

  validateFoldOne = (name, target) ->
    if not util.isArray(target)
      message = "require Array (Not Null) to folding, but #{typeof target}"
    else if 1 > target.length
      message = 'Array length is 0, and without init value'
    else
      return
    util.invalidArgumentError name, target, message

  foldingFrom = (direction) ->
    selectIndex = direction.selectIndex

    foldArray = (iterator, callback, init, array) ->
      memo = init
      index = count = selected = 0
      finished = no
      limit = array.length
      accumulate = key = null

      folding = (value, index, iterable) ->
        accumulate = (error, result) ->
          return if finished
          memo = result
          if error or ++count >= limit
            finished = yes
            callback(error, memo)
          return
        iterator(accumulate, memo, value, index, iterable)
        return

      main = () ->
        return if finished
        if count >= index and index < limit
          key = selectIndex(index, limit)
          folding(array[key], key, array)
          ++index
        return main

    getInit = direction.getInit
    fold1Name = direction.name + '1'

    withInit: (iterator, receiver, init, array) ->
      if typeof receiver isnt 'function'
        throw new Error("callback is not function: #{typeof receiver}")
        return
      if typeof iterator isnt 'function'
        receiver(new Error("iterator is not function: #{typeof iterator}"))
        return
      unless util.isArray(array)
        receiver(new Error("foldable should kind of Array list"))
        return
      if 1 > array.length
        receiver(null, init)
        return
      foldArray(iterator, receiver, init, array)

    withoutInit: (iterator, receiver, array) ->
      error = validateFoldOne(fold1Name, array)
      return receiver(error) if error

      copied = array.slice()
      init = copied[getInit]()
      if 1 > copied.length
        receiver(null, init)
        return
      foldArray(iterator, receiver, init, copied)

  fold =
    left: foldingFrom direction.left
    right: foldingFrom direction.right

  util.trampolines
    foldl:  fold.left.withInit
    foldr:  fold.right.withInit
    foldl1: fold.left.withoutInit
    foldr1: fold.right.withoutInit
