pp.extend (util) ->
  util.trampolines
    any: (iterator, receiver, iterable) ->
      if typeof receiver isnt 'function'
        message = "callback required function, but #{typeof receiver}"
        throw util.invalidArgumentError 'pp#any', receiver, message
        return
      if typeof iterator isnt 'function'
        message = "iterator required function, but #{typeof iterator}"
        receiver util.invalidArgumentError 'pp#any', iterator, message
        return

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
          receiver error, no
        else
          receiver error, result, key
        return

      util.each check, after, iterable

    all: (iterator, receiver, iterable) ->
      if typeof receiver isnt 'function'
        message = "callback required function, but #{typeof receiver}"
        throw util.invalidArgumentError 'pp#all', receiver, message
        return
      if typeof iterator isnt 'function'
        message = "iterator required function, but #{typeof iterator}"
        receiver util.invalidArgumentError 'pp#all', iterator, message
        return

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
          receiver error, yes
        else
          receiver error, no, key
        return

      util.each check, after, iterable

    find: (iterator, receiver, iterable) ->
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
          receiver error
        else
          receiver error, value, key
        return

      util.each check, after, iterable
