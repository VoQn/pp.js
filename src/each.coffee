pp.extend (util) ->

  genEach = (callback, state, limit) ->
    next = (error) ->
      return if state.hasFinished
      if error or ++state.count >= limit
        state.hasFinished = yes
        callback(error or null)
      return
    () -> next

  util.trampolines
    each:      util.iteratorMixin('pp#each',      'fill',  genEach)
    eachOrder: util.iteratorMixin('pp#eachOrder', 'order', genEach)
