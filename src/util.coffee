__ =
  extend: (properties) ->
    for key, value of properties
      if properties.hasOwnProperty key
        @[key] = value
    @

  keys: Object.keys or (any) ->
    key for key of any

  slice: Array::slice

  isPrimitive: (any) ->
    switch typeof any
      when 'undefined', 'boolean', 'number', 'string' then yes
      else any is null

  isArray: Array.isArray or (any) ->
    Object::toString.call(any) is '[object Array]'

  inherit: Object.create or (any) ->
    copied = any
    return copied if __.isPrimitive any
    return any.slice() if __.isArray any
    Inherit = ->
    Inherit.prototype = any.prototype
    new Inherit()

  nothing: ->

  id: (x) -> x

  not: (x) -> not x

  defer: do ->
    _nextTick = (fn) ->
      if 1 < arguments.length
        args = __.slice.call arguments, 1
        process.nextTick () ->
          fn.apply null, args
          return
        return
      else
        process.nextTick fn
        return

    _nextTimeout = (fn) ->
      if 1 < arguments.length
        args = __.slice.call arguments, 1
        timer = setTimeout ->
          clearTimeout timer
          fn.apply null, args
          return
        , 0
        return
      else
        timer = setTimeout ->
          clearTimeout timer
          fn()
          return
        , 0
        return

    if typeof process isnt 'undefined' and typeof process.nextTick is 'function'
      _nextTick
    else
      _nextTimeout

  error:
    invalidArgument: (api_name, any, message) ->
      new TypeError "#{api_name} - Invalid Argument : #{any}\n#{message}"

pp.defer = __.defer
