metaContext.doTaskBy = (apiName, mapProc) ->
  makeProc = (tasks, callback) ->
    iterator = (next, fn) ->
      if typeof fn isnt 'function'
        message = "required function. but include #{typeof fn}"
        next __.error.invalidArgument apiName, fn, message
        return
      fn ->
        next.apply null, __.slice.call arguments
        return
      return

    mapProc iterator, callback, tasks

contexts.extend
  fill:  metaContext.doTaskBy 'pp#fill', contexts.map
  order: metaContext.doTaskBy 'pp#order', contexts.mapOrder
