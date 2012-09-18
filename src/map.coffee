pp.extend (util) ->
  map =
    arrayMap: (forEach) ->
      arrayMap = (iterator, callback, array) ->
        modified = []
        mapping = (next, value, index, iterable) ->
          collect = (error, result) ->
            modified[index] = result
            next error
            return
          iterator collect, value, index, iterable
          return
        after = (error) ->
          callback error, modified
          return
        forEach mapping, after, array

    hashMap: (forEach) ->
      hashMap = (iterator, callback, hash) ->
        modified = {}
        mapping = (next, key, index, keys) ->
          collect = (error, result) ->
            modified[key] = result
            next error
            return
          iterator collect, hash[key], key, hash
          return
        after = (error) ->
          callback error, modified
          return
        forEach mapping, after, util.keys hash

    mixin: (name, type) ->
      forEach = util.forEach[type]
      util.iteratorMixin name, @arrayMap(forEach), @hashMap(forEach)

  util.trampolines
    map:      map.mixin 'pp#map',      'fill'
    mapOrder: map.mixin 'pp#mapOrder', 'order'
