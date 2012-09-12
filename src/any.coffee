pp.extend (util) ->
  util.trampolines
    any: (iterator, receiver, iterable) ->
      pred = (next, value, key, iterable) ->
        afterCheck = (error, result) ->
          if result
            next error, result, key
            return
          next error
          return
        iterator afterCheck, value, key, iterable
        return
      after = (error, result, key) ->
        if arguments.length < 2
          receiver error, no
          return
        receiver error, result, key
        return
      util.each pred, after, iterable

    all: (iterator, receiver, iterable) ->
      pred = (next, value, key, iterable) ->
        afterCheck = (error, result) ->
          if result
            next error
            return
          next error, result, key
          return
        iterator afterCheck, value, key, iterable
        return
      after = (error, result, key) ->
        if arguments.length < 2
          receiver error, yes
          return
        receiver error, no, key
        return
      util.each pred, after, iterable

    find: (iterator, receiver, iterable) ->
      pred = (next, value, key, iterable) ->
        afterCheck = (error, result) ->
          if result
            next error, value, key
            return
          next error
          return
        iterator afterCheck, value, key, iterable
        return
      after = (error, value, key) ->
        if arguments.length < 2
          receiver error
          return
        receiver error, value, key
        return
      util.each pred, after, iterable
