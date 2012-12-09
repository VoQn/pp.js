pp.extend (util) ->

  some = (callback, state, limit) ->
    next = (error, result) ->
      return if state.hasFinished
      if error or result or ++state.count >= limit
        state.hasFinished = yes
        callback(error or null, result or no)
      return
    () -> next

  every = (callback, state, limit) ->
    next = (error, result) ->
      return if state.hasFinished
      if error or not result
        state.hasFinished = yes
        callback(error or null, no)
        return
      if ++state.count >= limit
        state.hasFinished = yes
        callback(null, yes)
      return
    () -> next

  detect = (callback, state, limit) -> (value, key) -> (error, result) ->
    return if state.hasFinished
    if result
      state.hasFinished = yes
      callback(error or null, value, key)
      return
    if error or ++state.count >= limit
      state.hasFinished = yes
      callback(error or null)
    return

  util.trampolines
    any:  util.iteratorMixin('pp#any',  'fill', some)
    all:  util.iteratorMixin('pp#all',  'fill', every)
    find: util.iteratorMixin('pp#find', 'fill', detect)
