pp.extend (util) ->

  arrayFilter = (callback, state, limit, stored) -> (value) -> (error, result) ->
    return if state.hasFinished
    stored.push(value) if result
    if error or ++state.count >= limit
      state.hasFinished = yes
      callback(error, stored)
    return

  hashFilter = (callback, state, limit, stored) -> (value, key) -> (error, result) ->
    return if state.hasFinished
    stored[key] = value if result
    if error or ++state.count >= limit
      state.hasFinished = yes
      callback(error, stored)
    return

  arrayReject = (callback, state, limit, stored) -> (value) -> (error, result) ->
    return if state.hasFinished
    stored.push(value) unless result
    if error or ++state.count >= limit
      state.hasFinished = yes
      callback(error, stored)
    return

  hashReject = (callback, state, limit, stored) -> (value, key) -> (error, result) ->
    return if state.hasFinished
    stored[key] = value unless result
    if error or ++state.count >= limit
      state.hasFinished = yes
      callback(error, stored)
    return

  util.trampolines
    filter: util.iteratorMixin('pp#filter', 'order', arrayFilter, hashFilter)
    reject: util.iteratorMixin('pp#reject', 'order', arrayReject, hashReject)
