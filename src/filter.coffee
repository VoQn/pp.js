pp.extend (util) ->
  filterBy = (name, tester) ->
    arrayFilter = (iterator, callback, array) ->
        stackMatched = []
        pushMatched  = null
        filter = (next, value, index) ->
          pushMatched = (error, result) ->
            stackMatched.push value if tester result
            next error
            return
          iterator pushMatched, value, index, array
          return
        after = (error) ->
          callback error, stackMatched
          return
        util.arrayEachOrder filter, after, array

    hashFilter = (iterator, callback, hash) ->
        modified   = util.inherit hash
        putMatched = null
        filter = (next, key, index, keys) ->
          putMatched = (error, result) ->
            modified[key] = hash[key] if tester result
            next error
            return
          iterator putMatched, hash[key], key, hash
          return
        after = (error) ->
          callback error, modified
          return
        util.arrayEachFill filter, after, util.keys hash

    util.iteratorMixin name, arrayFilter, hashFilter

  util.trampolines
    filter: filterBy 'pp#filter', util.id
    reject: filterBy 'pp#reject', util.not
