pp.extend (util) ->
  logical = (name, test, wrap) ->
    arrayCheck = (iterator, receiver, array) ->
      afterCheck = null

      checkIterate = (next, value, index, iterable) ->
        afterCheck = (error, result) ->
          if test result
            next error, value, index
            return
          next error
          return
        iterator afterCheck, value, index, iterable
        return
      util.arrayEachFill checkIterate, wrap(receiver), array

    hashCheck = (iterator, receiver, hash) ->
      afterCheck = null
      checkIterate = (next, key, index, keys) ->
        afterCheck = (error, result) ->
          if test result
            next error, hash[key], key
            return
          next error
          return
        iterator afterCheck, hash[key], key, hash
        return
      util.arrayEachFill checkIterate, wrap(receiver), util.keys hash
    util.iteratorMixin name, arrayCheck, hashCheck

  judgeByLength = (judge) ->
    wrapper = (receiver) ->
      callback = (error) ->
        receiver error, judge arguments.length
        return

  isHaltLoop = (n) -> n > 1
  isReachEnd = (n) -> n < 2

  util.trampolines
    any:  logical 'pp#any',  util.id,  judgeByLength isHaltLoop
    all:  logical 'pp#all',  util.not, judgeByLength isReachEnd
    find: logical 'pp#find', util.id,  util.id
