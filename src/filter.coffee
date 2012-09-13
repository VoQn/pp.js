pp.extend (util) ->
  filter =
    array: (tester) ->
      arrayFilter = (iterator, callback, array) ->
        matched = []
        filtering = (next, value, index) ->
          collect = (error, result) ->
            matched.push value if tester result
            next error
            return
          iterator collect, value, index, array
        after = (error) ->
          callback error, matched
          return
        util.forEach.order filtering, after, array

    hash: (tester) ->
      hashFilter = (iterator, callback, hash) ->
        matched = {}
        filtering = (next, key, index, keys) ->
          collect = (error, result) ->
            matched[key] = hash[key] if tester result
            next error
            return
          iterator collect, hash[key], key, hash
          return
        after = (error) ->
          callback error, matched
          return
        util.forEach.order filtering, after, util.keys hash

    mixin: (name, tester) ->
      util.iteratorMixin name, @array(tester), @hash(tester)

  util.trampolines
    filter: filter.mixin 'pp#filter', util.id
    reject: filter.mixin 'pp#reject', util.not
