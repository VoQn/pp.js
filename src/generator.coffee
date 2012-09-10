class Generator
  constructor: (continuation) ->
    @continuation = continuation

  next: (success) ->
    success = internal.id if typeof success isnt 'function'

    @continuation (next, args...) ->
      @continuation = next
      ret = success.apply(null, args) or
        if args.length is 1
        then args[0]
        else args
      ret

pp.generator = (fn) ->
  new Generator fn
