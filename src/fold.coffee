__.error.invalidFolding = (apiName, target) ->
  if not __.isArray target
    errorMessage = "require Array (Not Null) to folding, but #{typeof target}"
  else if target.length < 1
    errorMessage = 'Array length is 0, and without init value'
  else
    return
  __.error.invalidArgument apiName, target, errorMessage

__.extend.call metaContext,
  foldBy: (setIndex) ->
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

  foldOne: (name, method, fold) ->
    folding = (iterator, receiver, array) ->
      error = __.error.invalidFolding name, array

      if error
        receiver error
        return

      copied = array.slice()
      init = copied[method]()

      fold iterator, receiver, init, copied

contexts.extend do ->
  reverseIndex = (index, limit) ->
    limit - (index + 1)

  meta      = metaContext
  foldOne   = meta.foldOne
  foldLeft  = meta.foldBy __.id
  foldRight = meta.foldBy reverseIndex

  foldl:  foldLeft
  foldr:  foldRight
  foldl1: foldOne 'pp#foldl1', 'shift', foldLeft
  foldr1: foldOne 'pp#foldr1', 'pop',   foldRight
