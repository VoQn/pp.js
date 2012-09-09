contexts.extend do ->
  untilBy = (check) ->
    cpsLoop = (test, iterator, callback, init) ->
      memo = if __.isArray init then init.slice() else []
      finished = no

      next = (error, args...) ->
        return if finished
        if error
          finished = yes
          callback error
        else
          memo = args if args.length
        return

      afterTest = (error, result) ->
        if error or check result
          finished = yes
          memo.unshift error or null
          callback.apply null, memo
        else
          memo.unshift next
          iterator.apply null, memo
        return

      mainArgs = [afterTest]

      main = ->
        return if finished
        test.apply null, mainArgs.concat memo
        main

  whilist: untilBy __.not
  until:   untilBy __.id
