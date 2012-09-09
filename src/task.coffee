contexts.extend do ->
  doTaskBy  = (apiName, mapProc) ->
    runTask = (tasks, callback) ->
      iterator = (next, fn) ->
        if typeof fn isnt 'function'
          message = "required function. but include #{typeof fn}"
          next __.error.invalidArgument apiName, fn, message
          return
        fn (args...) ->
          next.apply null, args
          return
        return
      mapProc iterator, callback, tasks

  fill:  doTaskBy 'pp#fill',  contexts.map
  order: doTaskBy 'pp#order', contexts.mapOrder
