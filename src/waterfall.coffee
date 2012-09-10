pp.iterator = (procs) ->
  limit = procs.length
  return unless limit

  iteratorCache = []

  procByIndex = (index) ->
    return iteratorCache[index] if index < iteratorCache.length

    fn = (args...) ->
        procs[index].apply procs[index], args
        fn.next()

    fn.next = ->
      if index < limit - 1
      then procByIndex index + 1
      else null

    fn.clearCache = ->
      iteratorCache = []
      return

    iteratorCache[index] = fn

    fn

  procByIndex 0

pp.waterfall = (procs, callback = internal.id) ->
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
      next = iterator.next()
      args.unshift if next then wrap next else whenEnd
      pp.defer ->
        iterator.apply iterator, args
        return
      return

  pp.defer wrap pp.iterator procs
  return
