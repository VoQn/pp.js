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
