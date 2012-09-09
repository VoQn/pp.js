contexts =
  _iteratorMixin: (mixinName, arrayIterator, hashIterator) ->
    mixin = (iterator, receiver, iterable) ->
      if __.isPrimitive iterable
        return receiver __.error.invalidArgument mixinName, iterable,
          'required Array or Object as HashMap'
      if __.isArray iterable
      then arrayIterator iterator, receiver, iterable
      else hashIterator iterator, receiver, iterable

  extend: (params) ->
    for name, proc of params
      if params.hasOwnProperty name
        @[name] = proc
        pp[name] = trampoline.partial proc unless name.match /^_/i
    @

pp.extend = (contextMakers) ->
  for apiName, apiProc of contextMakers
    if contextMakers.hasOwnProperty name
      contexts[name] = apiProc
      @[api_name] = trampoline.partial apiProc
  @
