class Generator
  constructor: (continuation) ->
    @continuation = continuation

  next: (success) ->
    if typeof success isnt 'function'
      success = __.id

    @continuation (next) ->
      @continuation = next
      switch arguments.length
        when 1 then return
        when 2 then success arguments[1]
        else success.apply null, __.slice.call arguments, 1

pp.generator = (fn) ->
  new Generator fn

