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
        memo.unshift null
        callback.apply null, memo
        return
      memo.unshift next
      iterator.apply null, memo
      return

    iterate = pp.context
      func: (after, args) ->
        test.apply null, after.concat args
        main
      args: [[afterCheck]]

    main = pp.context
      func: ->
        return if finished
        iterate.args[1] = memo
        iterate

contexts.extend
  whilist: metaContext.until_by __.not
  until:   metaContext.until_by __.id
