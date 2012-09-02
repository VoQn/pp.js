class Trampoline
  TIME_SLICE = do ->
    slices = {}
    fpsRate = [240, 120, 60, 30, 25, 15, 1]
    for rate in fpsRate
      slices["FPS_#{rate}"] = Math.ceil(1000 / rate) - 1
    slices

  current   = null
  timeSlice = 0
  timeLimit = 0
  procStack = []
  timeStack = []

  getUnixTime = Date.now or -> +new Date

  invoke = ->
    return if procStack.length < 1

    current   = procStack.shift()
    timeSlice = timeStack.shift()
    timeLimit = getUnixTime() + timeSlice

    while typeof current is 'function' and getUnixTime() < timeLimit
      current = current()

    if typeof current is 'function'
      procStack.push current
      timeStack.push timeSlice

    __.defer invoke
    return

  limitTimeSlice = (timeSlice) ->
    if typeof timeSlice isnt 'number'
    then TIME_SLICE.FPS_240
    else Math.max timeSlice, TIME_SLICE.FPS_240

  register = (fn) ->
    requireLength = fn.length

    if requireLength < 1
      proc = fn
    else
      args = __.slice.call arguments, 1, requireLength + 1
      proc = -> fn.apply null, args

    if requireLength < arguments.length
      timeSlice = arguments[requireLength + 1]

    procStack.push proc
    timeStack.push limitTimeSlice timeSlice
    if procStack.length is 1
      invoke()
    return

  partial = (fn) ->
    partialized = ->
      args = if arguments.length then __.slice.call arguments else []
      if fn.length > args.length
        partial = ->
          return partial if arguments.length < 1
          partialized.apply null, args.concat __.slice.call arguments
      else
        args.unshift fn
        register.apply null, args

  constuctor: ->
  TIME_SLICE: TIME_SLICE
  getCurrent: -> current
  register:   register
  partial:    partial

trampoline = new Trampoline()

pp.TIME_SLICE = trampoline.TIME_SLICE
