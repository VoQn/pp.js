pp.extend (util) ->
  class Generator
    constructor: (continuation, initialize, changeState) ->
      @continuation = continuation
      @initialize   = initialize or util.nothing
      @changeState  = changeState or util.nothing

    next: (success) ->
      success = util.id if typeof success isnt 'function'

      @continuation (next, args...) ->
        @continuation = next
        ret = success.apply(null, args) or
          if args.length is 1 then args[0] else args
        ret

    reset: (values...) ->
      ret = @initialize.apply @, [(next, args...) ->
        @continuation = next
        if args.length is 1 then args[0] else args
      ].concat values
      ret

    jump: (values...) ->
      ret = @changeState.apply @, [(next, args...) ->
        @continuation = next
        if args.length is 1 then args[0] else args
      ].concat values
      ret

  generator: (continuation, initialize, changeState) ->
    new Generator continuation, initialize, changeState
