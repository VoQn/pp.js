trampoline = do ->
  TIME_SLICE = do ->
    slices = {}
    for rate in [240, 120, 75, 60, 45, 30, 27, 15, 1]
      slices["FPS_#{rate}"] = ~~(1000 / rate)
    slices

  procStack = []
  timeStack = []
  current   = null
  timeSlice = 0
  timeLimit = 0

  getUnixTime = Date.now or -> +new Date()

  invoke = ->
    current   = procStack.shift()
    timeSlice = timeStack.shift()
    timeLimit = getUnixTime() + timeSlice

    while typeof current is 'function' and getUnixTime() < timeLimit
      current = current()

    if typeof current is 'function'
      procStack.push current
      timeStack.push timeSlice

    pp.defer invoke if procStack.length
    return

  limitTimeSlice = (timeSlice) ->
    if typeof timeSlice isnt 'number'
    then TIME_SLICE.FPS_240
    else Math.max timeSlice, TIME_SLICE.FPS_240

  register = (fn, args...) ->
    requireLength = fn.length
    proc = fn.apply null, args.slice 0, requireLength
    return if typeof proc isnt 'function'

    timeSlice = args[requireLength] if requireLength < args.length
    procStack.push proc
    timeStack.push limitTimeSlice timeSlice
    pp.defer invoke if procStack.length is 1
    return

  partial = (fn) ->
    partialized = (args...) ->
      if fn.length > args.length
        partialApply = (adds...) ->
          return partialApply if adds.length < 1
          partialized.apply null, args.concat adds
      else
        args.unshift fn
        register.apply null, args

  TIME_SLICE: TIME_SLICE
  register:   register
  partial:    partial

pp.TIME_SLICE = trampoline.TIME_SLICE
