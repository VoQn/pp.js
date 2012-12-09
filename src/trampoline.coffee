pp.extend (util) ->
  TIME_SLICE = do () ->
    slices = {}
    for rate in [240, 120, 75, 60, 45, 30, 24, 15, 12, 10, 5, 2, 1]
      slices["FPS_#{rate}"] = Math.floor(1000 / rate)
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
      procStack.push(procedure)
      timeStack.push(timeSlice)

    pp.defer(invoke)
    return

  TIME_SLICE: TIME_SLICE

  trampoline: (fn) ->
    requireLength = fn.length
    partialized = (args...) ->
      if requireLength <= args.length
        proc = fn.apply(null, args.slice(0, requireLength))
        return if proc is undefined

        timeSlice =
          if requireLength < args.length
          then args[requireLength]
          else null
        if typeof timeSlice isnt 'number'
          timeSlice = TIME_SLICE.FPS_240
        else if timeSlice < TIME_SLICE.FPS_240
          timeSlice = TIME_SLICE.FPS_240

        procStack.push(proc)
        timeStack.push(timeSlice)
        pp.defer(invoke) if procStack.length is 1
        return

      apply = (adds...) ->
        return apply if adds.length < 1
        partialized.apply(null, args.concat(adds))

  _trampolines: (procedures) ->
    trampolines = {}
    for own name, proc of procedures
      if name.match(/^_/)
        trampolines[name] = proc
      else
        trampolines["_#{name}"] = proc
        trampolines[name] = pp.trampoline(proc)
    trampolines
