class Trampoline
  TIME_SLICE = do ->
    slices = {}
    fpsRate = [240, 120, 60, 30, 25, 15, 1]
    for rate in fpsRate
      slices["FPS_#{rate}"] = Math.ceil(1000 / rate) - 1
    slices

  current   = null
  procStack = []
  timeStack = []

  invoke = do ->
    getTime   = -> new Date().getTime()
    timeSlice = 0
    timeLimit = 0

    invoke    = ->
      return if procStack.length < 1
      current   = procStack.shift()
      timeSlice = timeStack.shift()
      timeLimit = getTime() + timeSlice

      while typeof current is 'function' and getTime() < timeLimit
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

    if requireLength < arguments.length
      timeSlice = arguments[requireLength + 1]

    if requireLength < 1
      proc = fn
    else
      args = __.slice.call arguments, 1, requireLength + 1
      proc = -> fn.apply null, args

    procStack.push proc
    timeStack.push limitTimeSlice timeSlice
    invoke() if procStack.length is 1
    return

  constructor: ->
  TIME_SLICE: TIME_SLICE
  getCurrent: -> current
  register: register
  partial: (fn) ->
    partialized = ->
      args = __.slice.call arguments
      if fn.length > args.length
        partial = ->
          return partial if arguments.length < 1
          partialized.apply null, args.concat __.slice.call arguments
      else
        args.unshift fn
        register.apply null, args

pp.TIME_SLICE = Trampoline::TIME_SLICE
