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
    if not util.isArray target
      message = "require Array (Not Null) to folding, but #{typeof target}"
    else if not target.length
      message = 'Array length is 0, and without init value'
    else
      return
    util.invalidArgumentError name, target, message

  foldingFrom = (direction) ->
    selectIndex = direction.selectIndex

    foldArray = (iterator, callback, init, array) ->
      memo = init
      folding = (next, value, index, iterable) ->
        index = selectIndex index, iterable.length
        accumulate = (error, result) ->
          memo = result
          next error
          return
        iterator accumulate, memo, iterable[index], index, iterable
        return
      after = (error) ->
        callback error, memo
        return
      util.forEach.order folding, after, array

    getInit = direction.getInit
    fold1Name = direction.name + '1'

    withInit: foldArray
    withoutInit: (iterator, receiver, array) ->
        error = validateFoldOne fold1Name, array
        return receiver error if error

        copied = array.slice()
        init = copied[getInit]()
        foldArray iterator, receiver, init, copied

  fold =
    left: foldingFrom direction.left
    right: foldingFrom direction.right

  util.trampolines
    foldl:  fold.left.withInit
    foldr:  fold.right.withInit
    foldl1: fold.left.withoutInit
    foldr1: fold.right.withoutInit
