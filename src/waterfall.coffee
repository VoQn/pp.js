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

  waterfall: (procs, callback) ->
    return callback() unless procs.length
    finished = no
    wrap = (iterator) ->
      whenEnd = (results...) ->
        callback.apply null, results
        iterator.clearCache()
        return

      wrapped = (error, args...) ->
        return if finished
        if error
          finished = yes
          callback error
          return
        pp.defer () ->
          next = iterator.next()
          args.unshift if next then wrap next else whenEnd
          iterator.apply iterator, args
          return
        return
    pp.defer wrap pp.iterator procs
    return
