pp.extend (util) ->
  TIME_SLICE = do ->
    slices = {}
    for rate in [240, 120, 75, 60, 45, 30, 27, 15, 1]
      slices["FPS_#{rate}"] = ~~(1000 / rate)
    slices

  getUnixTime = Date.now or -> +new Date()

  invoke = (proc, timeSlice) ->
    return if typeof proc isnt 'function'
    timeLimit = getUnixTime() + timeSlice
    while typeof proc is 'function' and getUnixTime() < timeLimit
      proc = proc()
    pp.defer invoke, proc, timeSlice
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
        proc = fn.apply null, args.slice 0, requireLength
        timeSlice =
          limitTimeSlice if requireLength < args.length
          then args[requireLength]
          else null
        pp.defer invoke, proc, timeSlice
        return

      apply = (adds...) ->
        return apply if adds.length < 1
        partialized.apply null, args.concat adds
