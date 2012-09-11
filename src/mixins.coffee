pp.extend = (contextMaker) ->
  reference =
    if typeof contextMaker is 'function'
    then contextMaker internal
    else contextMaker

  for own name, proc of reference
    isInternal = name.match /^_/i
    internal[if isInternal then name.substring 1 else name] = proc
    @[name] = trampoline.partial proc unless isInternal
  @

pp.extend (util) ->
  _iteratorMixin: (mixinName, arrayIterator, hashIterator) ->
    mixin = (iterator, receiver, iterable) ->
      if util.isPrimitive iterable
        message = 'required Array or Object as HashMap'
        receiver util.invalidArgumentError mixinName, iterable, message
        return
      if util.isArray iterable
        arrayIterator iterator, receiver, iterable
      else
        hashIterator iterator, receiver, iterable

