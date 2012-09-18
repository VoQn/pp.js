pp.extend (util) ->
  forEach = (iterator, callback, iterable) ->
    if util.isArray iterable
      util.forEach.fill iterator, callback, iterable
    else
      util.forEach.hash.fill iterator, callback, iterable

  predicators =
    any: (iterator, callback, iterable) ->
      check = (next, value, key, iterable) ->
        collect = (error, result) ->
          if result
            next error, result, key
          else
            next error
          return
        iterator collect, value, key, iterable
        return

      after = (error, result, key) ->
        if arguments.length < 2
          callback error, no
        else
          callback error, result, key
        return

      forEach check, after, iterable

    all: (iterator, callback, iterable) ->
      check = (next, value, key, iterable) ->
        collect = (error, result) ->
          if result
            next error
          else
            next error, result, key
          return
        iterator collect, value, key, iterable
        return

      after = (error, result, key) ->
        if arguments.length < 2
          callback error, yes
        else
          callback error, no, key
        return

      forEach check, after, iterable

    find: (iterator, callback, iterable) ->
      check = (next, value, key, iterable) ->
        collect = (error, result) ->
          if result
            next error, value, key
          else
            next error
          return

        iterator collect, value, key, iterable
        return

      after = (error, value, key) ->
        if arguments.length < 2
          callback error
        else
          callback error, value, key
        return

      forEach check, after, iterable

  validates = {}
  for own name, proc of predicators
    validates[name] = util.validateIteration "pp##{name}", proc
  util.trampolines validates
