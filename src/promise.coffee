pp.extend (util) ->
  UNRESOULVED = 'unresolved'
  PROGRESS    = 'progress'
  RESOLVED    = 'resolved'
  REJECTED    = 'rejected'

  fire = pp.trampoline (promise, value) ->
    taskIndex = 0
    promise.results = [value]

    callback = (error, results...) ->
      if error
        promise.state = REJECTED
        promise.results = [error]
        return
      promise.results = results
      return

    main = () ->
      if promise.stack.length <= taskIndex
        promise.state = RESOLVED if promise.state isnt REJECTED
        return
      entry = promise.stack[taskIndex++]
      proc = if promise.state is REJECTED then entry[1] else entry[0]
      if proc
        promise.results.unshift(callback)
        proc.apply(promise.scope, promise.results)
      main

    return main

  xOrNull = (x) -> x or null

  class Promise
    constructor: (scope) ->
      @state = UNRESOULVED
      @stack = []
      @scope = xOrNull(scope)

    STATE:
      UNRESOULVED: UNRESOULVED
      PROGRESS: PROGRESS
      RESOLVED: RESOLVED
      REJECTED: REJECTED

    resolve: (value) ->
      @state = PROGRESS
      fire @, value
      return this

    reject: (value) ->
      @state = REJECTED
      fire @, value
      return this

    isProgress: () ->
      @state is PROGRESS

    isResolved: () ->
      @state is RESOLVED

    isRejected: () ->
      @state is REJECTED

    next: (success, fail, progress) ->
      @stack.push(util.sync.map(xOrNull, [success, fail, progress]))
      fire(@, null) if @state isnt UNRESOULVED
      return this

    then: (success, fail, progress) ->
      wrap = (f) =>
        unless f?
          null
        else
          (next, args...) =>
            try
              r = f.apply(@scope, args)
              next(null, r)
            catch error
              next(error)
            return

      @stack.push(util.sync.map(wrap, [success, fail, progress]))
      fire(@, null) if @state isnt UNRESOULVED
      return this

  promise: (scope) ->
    new Promise(scope)
