pp.extend (util) ->
  untilBy = (check) ->
    cpsLoop = (test, iterator, callback, init) ->
      memo = if util.isArray init then init.slice() else []
      finished = no

      next = (error) ->
        return if finished
        if error
          finished = yes
          callback error
          return
        memo = util.slice.call arguments, 1 if arguments.length > 1
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

  util.trampolines
    whilist: untilBy util.not
    until:   untilBy util.id
