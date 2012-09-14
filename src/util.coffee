internal  = {}

pp.extend = (contextMaker) ->
  reference =
    if typeof contextMaker is 'function'
    then contextMaker internal
    else contextMaker

  for own name, proc of reference
    isInternal = name.match /^_/
    if isInternal
      internal[name.substring 1] = proc
    else
      @[name] = proc
  @ # return this

pp.extend (util) ->

  isPrimitive = (any) ->
    switch typeof any
      when 'undefined', 'boolean', 'number', 'string' then yes
      else any is null # NOTE typeof null return 'object'

  isArray = Array.isArray or (any) ->
    toString.call(any) is '[object Array]'

  nextTick = (fn, args...) ->
    process.nextTick () ->
      fn.apply null, args
      return
    return

  nextTimeout = (fn, args...) ->
    timer = setTimeout () ->
      clearTimeout timer
      fn.apply null, args
      return
    , 0
    return

  _isPrimitive: isPrimitive
  _isArray: isArray
  _keys: Object.keys or (any) ->
    key for own key of any
  _inherit: Object.create or (any) ->
    copied = any
    return copied if isPrimitive any
    return [] if isArray any
    return {} if toString.call(any) is '[object Object]'
    Inherit = () -> # Empty function (as plain constructor)
    Inherit.prototype = any.prototype
    new Inherit()
  _slice: [].slice
  _nothing: () -> # nothing to do
  _id: (x) -> x
  _not: (x) -> not x
  defer:
    if process and typeof process.nextTick is 'function'
    then nextTick
    else nextTimeout
  _invalidArgumentError: (api_name, any, message) ->
    new TypeError "#{api_name} - Invalid Argument : #{any}\n#{message}"
