contexts.extend do ->
  logical = (test, wrap) ->
    predicate = (iterator, receiver, iterable) ->
      afterCheck = null

      checkIterate = (next, value, key, iterable) ->
        afterCheck = (error, result) ->
          if test result
          then next error, value
          else next error
          return
        iterator afterCheck, value, key, iterable
        return

      contexts.each checkIterate, wrap(receiver), iterable

  judgeByLength = (judge) ->
    wrapper = (receiver) ->
      callback = (error) ->
        receiver error, judge arguments.length
        return

  isHaltLoop = (n) -> n > 1
  isReachEnd = (n) -> n < 2

  any:  logical __.id, judgeByLength isHaltLoop
  all:  logical __.not, judgeByLength isReachEnd
  find: logical __.id, __.id
