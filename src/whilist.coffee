metaContext.until_by = (check) ->
  makeProc = (test, iterator, callback, init) ->
    memo = if __.isArray init then init.slice() else []
    finished = no

    next = (error) ->
      return if finished
      if error
        finished = yes
        callback error
        return
      if arguments.length > 1
        memo = __.slice.call arguments, 1
      return

    afterCheck = (error, result) ->
      if check result
        finished = yes
        callback.apply null, [null].concat memo
        return
      iterator.apply null, [next].concat memo
      return

    proc = ->
      return if finished
      test.apply null, [afterCheck].concat memo
      proc

contexts.extend
  whilist: metaContext.until_by __.not
  until:   metaContext.until_by __.id
