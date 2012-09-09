contexts.extend do ->

  validateFoldOne = (name, target) ->
    if not __.isArray target
      message = "require Array (Not Null) to folding, but #{typeof target}"
    else if not target.length
      message = 'Array length is 0, and without init value'
    else
      return
    __.error.invalidArgument name, target, message

  foldBy = (setIndex) ->
    folding = (iterator, callback, init, array) ->
      memo       = init
      accumulate = null

      fold = (next, value, index, iterable) ->
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

      contexts._arrayEachOrder fold, after, array

  foldOne = (name, method, fold) ->
    folding = (iterator, receiver, array) ->
      error = validateFoldOne name, array
      return receiver error if error

      copied = array.slice()
      init = copied[method]()

      fold iterator, receiver, init, copied

  reverseIndex = (index, limit) -> limit - (index + 1)

  foldLeft  = foldBy __.id
  foldRight = foldBy reverseIndex

  foldl:  foldLeft
  foldr:  foldRight
  foldl1: foldOne 'pp#foldl1', 'shift', foldLeft
  foldr1: foldOne 'pp#foldr1', 'pop',   foldRight
