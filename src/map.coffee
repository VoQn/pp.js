pp.extend (util) ->

  genMapper = (callback, state, limit, stored) -> (_, key) -> (error, result) ->
    return if state.hasFinished
    stored[key] = result
    if error or ++state.count >= limit
      state.hasFinished = yes
      callback(error, stored)
    return

  util.trampolines
    map: util.iteratorMixin('pp#map', 'fill', genMapper)
    mapOrder: util.iteratorMixin('pp#mapOrder', 'order', genMapper)
