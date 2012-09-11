pp.extend (util) ->
  _trampolines: (procedures) ->
    trampolines = {}
    for own name, proc of procedures
      unless name.match /^_/i
        trampolines["_#{name}"] = proc
        trampolines[name]       = util.trampoline proc
      else
        trampolines[name] = proc
    trampolines

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
