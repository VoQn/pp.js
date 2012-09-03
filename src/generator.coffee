class Generator
  constructor: (continuation) ->
    @continuation = continuation

  next: (success) ->
    if typeof success isnt 'function'
      success = __.id

    @continuation (next) ->
      @continuation = next
      switch arguments.length
        when 1
          return success()
        when 2
          args = arguments[1]
          ret  = success args
        else
          args = __.slice.call arguments, 1
          ret  = success.apply null, args

      if typeof ret is 'undefined' then args else ret

pp.generator = (fn) ->
  new Generator fn
