class Promise
  UNRESOULVED = 'unresolved'
  RESOLVED    = 'resolved'
  REJECTED    = 'rejected'

  fire = trampoline.partial (promise, value) ->
    promise.result = value

    invoke = ->
      entry = promise.stack.shift()
      proc  = if promise.state is REJECTED then entry[1] else entry[0]

      if proc
        try
          promise.result = proc.call promise.scope, promise.result
        catch error
          promise.state  = REJECTED
          promise.result = error

      shift

    finish = ->
      promise.state = RESOLVED if promise.state isnt REJECTED
      return

    shift = ->
      if promise.stack.length < 1
        finish
      else
        invoke

  constructor: (scope) ->
    @state = UNRESOULVED
    @stack = []
    @scope = scope or null

  STATE:
    UNRESOULVED: UNRESOULVED
    RESOLVED: RESOLVED
    REJECTED: REJECTED

  resolve: (value) ->
    fire @, value
    @

  reject: (value) ->
    @state = REJECTED
    fire @, value
    @

  isResolved: ->
    @state is RESOLVED

  isRejected: ->
    @state is REJECTED

  then: (success, fail, progress) ->
    @stack.push [success or null, fail or null, progress or null]
    fire @, null if @state isnt UNRESOULVED
    @

pp.promise = (scope) ->
  new Promise scope

