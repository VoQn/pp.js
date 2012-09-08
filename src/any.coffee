metaContext.logical = (test, wrapCallback) ->
  makeProc = (iterator, receiver, iterable) ->
    afterCheck = null

    checkIterate = (next, value, key, iterable) ->
      afterCheck = (error, result) ->
        if test result
          next error, value
        else
          next error
        return
      iterator afterCheck, value, key, iterable
      return

    contexts.each checkIterate, wrapCallback(receiver), iterable

contexts.extend do ->
  logical = metaContext.logical
  judgeByLength = (judge) -> (receiver) -> (error) ->
    receiver error, judge arguments.length
    return

  any:  logical(__.id, judgeByLength (n) -> n > 1)
  all:  logical(__.not, judgeByLength (n) -> n < 2)
  find: logical(__.id, __.id)
