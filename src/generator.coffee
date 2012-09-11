pp.extend (util) ->
  class Generator
    constructor: (continuation) ->
      @continuation = continuation

    next: (success) ->
      success = util.id if typeof success isnt 'function'

      @continuation (next, args...) ->
        @continuation = next
        ret = success.apply(null, args) or
          if args.length is 1 then args[0] else args
        ret

  generator: (fn) ->
    new Generator fn
