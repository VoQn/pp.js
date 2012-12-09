pp.extend (util) ->
  expectBut = (identifer, expected, actual) ->
    "#{identifer} required a #{expected}, but #{typeof actual}"

  argError = (apiName) -> (subject, message) ->
    util.invalidArgumentError(apiName, apiName)

  genEnumerator =
    array:
      genState: (array) ->
        source: array
        limit: array.length
        stored: []
        count: 0
        hasFinished: no

      fill: (iterator, genCallback, state) ->
        index = 0
        value = null
        limit = state.limit
        iterable = state.source
        main = () ->
          return if state.hasFinished
          if index < limit
            value = iterable[index]
            iterator(genCallback(value, index), value, index, iterable)
            ++index
          main

      order: (iterator, genCallback, state) ->
        index = 0
        value = null
        limit = state.limit
        iterable = state.source
        main = () ->
          return if state.hasFinished
          if state.count >= index and index < limit
            value = iterable[index]
            iterator(genCallback(value, index), value, index, iterable)
            ++index
          main

    hash:
      genState: (hash) ->
        keys = util.keys(hash)

        source: hash
        keys: keys
        limit: keys.length
        stored: {}
        count: 0
        hasFinished: no

      fill: (iterator, genCallback, state) ->
        index = 0
        key   = ''
        value = null
        keys  = state.keys
        limit = state.limit
        iterable = state.source
        main = () ->
          return if state.hasFinished
          if index < limit
            key = keys[index]
            value = iterable[key]
            iterator(genCallback(value, key), value, key, iterable)
            ++index
          main

      order: (iterator, genCallback, state) ->
        index = 0
        key   = ''
        value = null
        keys  = state.keys
        limit = state.limit
        iterable = state.source
        main = () ->
          return if state.hasFinished
          if state.count >= index and index < limit
            key   = keys[index]
            value = iterable[key]
            iterator(genCallback(value, key), value, key, iterable)
            ++index
          main

    combine: (iterableType, loopType, genIterator) ->
      genState = @[iterableType].genState
      genLoop  = @[iterableType][loopType]
      (iterator, callback, iterable) ->
        state = genState(iterable)
        genCallback = genIterator(callback, state, state.limit, state.stored)
        genLoop(iterator, genCallback, state)

  _expectBut: expectBut

  _iteratorMixin: (mixinName, loopType, genForArray, genForHash) ->
    forArray = genEnumerator.combine('array', loopType, genForArray)
    forHash  = genEnumerator.combine('hash',  loopType, genForHash or genForArray)
    mismatch = argError(mixinName)
    (iterator, callback, iterable) ->
      if typeof callback isnt 'function'
        throw mismatch(callback, expectBut('callback', 'function', callback))
        return
      if typeof iterator isnt 'function'
        callback(mismatch(iterator, expectBut('iterator', 'function', iterator)))
        return
      if util.isPrimitive(iterable)
        callback(mismatch(iterable, expectBut('iterable', 'Array or Object', iterable)))
        return
      if util.isArray(iterable)
        if 1 > iterable.length
          callback(null, [])
          return
        return forArray(iterator, callback, iterable)
      if 1 > util.keys(iterable).length
        callback(null, {})
        return
      return forHash(iterator, callback, iterable)
