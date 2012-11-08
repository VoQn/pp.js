pp.extend (util) ->
  iterator: (procs) ->
    return unless limit = procs.length
    cache = []
    procedureByIndex = (index) ->
      return cache[index] if index < cache.length

      procedure = (args...) ->
        procs[index].apply procs[index], args
        procedure.next()

      procedure.next = () ->
        if index < limit - 1
          procedureByIndex index + 1
        else
          null

      procedure.clearCache = () ->
        cache = []
        return

      cache[index] = procedure
      procedure
    procedureByIndex 0

  waterfall: pp.trampoline (procs, callback) ->
    return callback() unless procs.length
    index = count = 0
    limit = procs.length
    memories = []
    finished = no

    next = (error, results...) ->
      return if finished
      memories = results or []
      if error or ++count >= limit
        finished = yes
        memories.unshift error or null
        callback.apply null, memories
      return

    main = () ->
      return if finished
      if index >= count and index < limit
        memories.unshift next
        procs[index++].apply null, memories
      main

