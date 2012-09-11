pp.extend (util) ->
  TIME_SLICE = do ->
    slices = {}
    for rate in [240, 120, 75, 60, 45, 30, 27, 15, 1]
      slices["FPS_#{rate}"] = ~~(1000 / rate)
    slices

  procStack = []
  timeStack = []

  getUnixTime = Date.now or -> +new Date()

  invoke = ->
    return unless procStack.length
    current   = procStack.shift()
    timeSlice = timeStack.shift()
    timeLimit = getUnixTime() + timeSlice

    while typeof current is 'function' and getUnixTime() < timeLimit
      current = current()

    if typeof current is 'function'
      procStack.push current
      timeStack.push timeSlice

    pp.defer invoke
    return

  limitTimeSlice = (timeSlice) ->
    if typeof timeSlice isnt 'number'
    then TIME_SLICE.FPS_240
    else Math.max timeSlice, TIME_SLICE.FPS_240

  TIME_SLICE: TIME_SLICE

  trampoline: (fn) ->
    requireLength = fn.length
    partialized = (args...) ->
      if requireLength <= args.length
        procStack.push ->
          fn.apply null, args.slice 0, requireLength
        timeStack.push limitTimeSlice(
          if requireLength < args.length
            args[requireLength]
          else 0
        )
        pp.defer invoke if procStack.length is 1
        return

      apply = (adds...) ->
        return apply if adds.length < 1
        partialized.apply null, args.concat adds
