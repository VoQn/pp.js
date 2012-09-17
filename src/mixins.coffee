pp.extend (util) ->
  _iteratorMixin: (mixinName, arrayIterator, hashIterator) ->
    mixin = (iterator, receiver, iterable) ->
      if typeof receiver isnt 'function'
        message = "receiver required function, but #{typeof receiver}"
        throw util.invalidArgumentError mixinName, receiver, message
        return
      if typeof iterator isnt 'function'
        message = "iterator required function, but #{typeof iterator}"
        receiver util.invalidArgumentError mixinName, iterator, message
        return
      if util.isPrimitive iterable
        message = "iterable required Array or Object as HashMap, but #{typeof iterable}"
        receiver util.invalidArgumentError mixinName, iterable, message
        return
      if util.isArray iterable
        arrayIterator iterator, receiver, iterable
      else
        hashIterator iterator, receiver, iterable
