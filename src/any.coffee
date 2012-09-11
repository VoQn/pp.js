pp.extend (util) ->
  logical = (test, wrap) ->
    predicate = (iterator, receiver, iterable) ->
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

      util.each checkIterate, wrap(receiver), iterable

  judgeByLength = (judge) ->
    wrapper = (receiver) ->
      callback = (error) ->
        receiver error, judge arguments.length
        return

  isHaltLoop = (n) -> n > 1
  isReachEnd = (n) -> n < 2

  any:  logical util.id,  judgeByLength isHaltLoop
  all:  logical util.not, judgeByLength isReachEnd
  find: logical util.id,  util.id
