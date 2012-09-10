pp.extend (util) ->
  forEach = util.arrayEachOrder

  foldBy = (setIndex) ->
    cpsFold = (iterator, callback, init, array) ->
      memo       = init
      accumulate = null

      folding = (next, value, index, iterable) ->
        index = setIndex index, iterable.length
        accumulate = (error, result) ->
          memo = result
          next error
          return
        iterator accumulate, memo, iterable[index], index, iterable
        return

      after = (error) ->
        callback error, memo
        return

      forEach folding, after, array

  validateFoldOne = (name, target) ->
    if not util.isArray target
      message = "require Array (Not Null) to folding, but #{typeof target}"
    else if not target.length
      message = 'Array length is 0, and without init value'
    else
      return
    util.invalidArgumentError name, target, message

  foldOne = (name, method, fold) ->
    folding = (iterator, receiver, array) ->
      error = validateFoldOne name, array
      return receiver error if error

      copied = array.slice()
      init = copied[method]()

      fold iterator, receiver, init, copied

  reverseIndex = (index, limit) -> limit - (index + 1)

  foldLeft  = foldBy util.id
  foldRight = foldBy reverseIndex

  foldl:  foldLeft
  foldr:  foldRight
  foldl1: foldOne 'pp#foldl1', 'shift', foldLeft
  foldr1: foldOne 'pp#foldr1', 'pop',   foldRight
