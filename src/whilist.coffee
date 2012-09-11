pp.extend (util) ->
  untilBy = (check) ->
    cpsLoop = (test, iterator, callback, init) ->
      memo = if util.isArray init then init.slice() else []
      finished = no

      next = (error, args...) ->
        return if finished
        if error
          finished = yes
          callback error
          return
        memo = args if args.length
        return

      afterTest = (error, result) ->
        if error or check result
          finished = yes
          memo.unshift error or null
          callback.apply null, memo
          return
        memo.unshift next
        iterator.apply null, memo
        return

      mainArgs = [afterTest]

      main = ->
        return if finished
        test.apply null, mainArgs.concat memo
        main

  whilist: untilBy util.not
  until:   untilBy util.id
