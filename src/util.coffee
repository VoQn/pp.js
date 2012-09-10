internal = do ->

  isPrimitive = (any) ->
    switch typeof any
      when 'undefined', 'boolean', 'number', 'string' then yes
      else any is null

  isArray = Array.isArray or (any) ->
    Object::toString.call(any) is '[object Array]'

  nextTick = (fn, args...) ->
    process.nextTick ->
      fn.apply null, args
      return
    return

  nextTimeout = (fn, args...) ->
    timer = setTimeout ->
      clearTimeout timer
      fn.apply null, args
      return
    , 0
    return

  isPrimitive: isPrimitive
  isArray: isArray
  keys: Object.keys or (any) -> key for key of any
  inherit: Object.create or (any) ->
    copied = any
    return copied if isPrimitive any
    return any.slice() if isArray any
    Inherit = ->
    Inherit.prototype = any.prototype
    new Inherit()

  nothing: ->
  id: (x) -> x
  not: (x) -> not x
  defer:
    if process and typeof process.nextTick is 'function'
    then nextTick
    else nextTimeout
  invalidArgumentError: (api_name, any, message) ->
    new TypeError "#{api_name} - Invalid Argument : #{any}\n#{message}"

pp.defer = internal.defer
