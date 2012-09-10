pp.extend (util) ->
  doTaskBy = (name, mapping) ->
    cpsIterate = (tasks, callback) ->
      iterator = (next, fn) ->
        if typeof fn isnt 'function'
          message = "required function. but include #{typeof fn}"
          next util.invalidArgumentError name, fn, message
          return
        fn (args...) ->
          next.apply null, args
          return
        return
      mapping iterator, callback, tasks

  fill:  doTaskBy 'pp#fill',  util.map
  order: doTaskBy 'pp#order', util.mapOrder
