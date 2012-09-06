class Context
  constructor: (func, args, scope, name) ->
    @func  = func or ->
    @args  = args or []
    @scope = scope or null
    @name  = name or '<anonymous>'

  evaluate: ->
    @func.apply @scope, @args

pp.context = (stub) ->
  new Context stub.func, stub.args, stub.scope, stub.name
