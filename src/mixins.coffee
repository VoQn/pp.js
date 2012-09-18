pp.extend (util) ->
  expectBut = (identifer, expected, actual) ->
    "#{identifer} required a #{expected}, but #{typeof actual}"
  _validateIteration: (name, iteration) ->
    validated = (iterator, callback, iterable) ->
      argError = util.invalidArgumentError

      if typeof callback isnt 'function'
        throw argError name, callback
        , expectBut 'callback', 'function', callback
        return
      if typeof iterator isnt 'function'
        callback argError name, iterator
        , expectBut 'iterator', 'function', iterator
        return
      if util.isPrimitive iterable
        callback argError name, iterable
        , expectBut 'iterable', 'Array or Object (as HashTable)', iterable
        return
      iteration iterator, callback, iterable
  _iteratorMixin: (mixinName, arrayIterator, hashIterator) ->
    mixin = util.validateIteration mixinName, (iterator, callback, iterable) ->
      if util.isArray iterable
        arrayIterator iterator, callback, iterable
      else
        hashIterator iterator, callback, iterable
