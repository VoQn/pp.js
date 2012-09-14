pp.extend (util) ->
  TIME_SLICE = do () ->
    slices = {}
    for rate in [240, 120, 75, 60, 45, 30, 27, 15, 1]
      slices["FPS_#{rate}"] = ~~(1000 / rate)
    slices

  getUnixTime = Date.now or -> +new Date()
  procStack   = []
  timeStack   = []

  invoke = () ->
    return unless procStack.length
    procedure = procStack.shift()
    timeSlice = timeStack.shift()
    timeLimit = getUnixTime() + timeSlice

    while typeof procedure is 'function' and getUnixTime() < timeLimit
      procedure = procedure()

    if typeof procedure is 'function'
      procStack.push procedure
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
        procStack.push fn.apply null, args.slice 0, requireLength
        timeStack.push limitTimeSlice(
          if requireLength < args.length
          then args[requireLength]
          else null
        )
        pp.defer invoke if procStack.length is 1
        return

      apply = (adds...) ->
        return apply if adds.length < 1
        partialized.apply null, args.concat adds

  _trampolines: (procedures) ->
    trampolines = {}
    for own name, proc of procedures
      if name.match /^_/
        trampolines[name] = proc
      else
        trampolines["_#{name}"] = proc
        trampolines[name] = pp.trampoline proc
    trampolines
