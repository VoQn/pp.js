pp.extend (util) ->
  arrayFilterBy = (tester) ->
    cpsFilter = (iterator, callback, array) ->
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

  hashFilterBy = (tester) ->
    cpsFilter = (iterator, callback, hash) ->
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

  mixin = util.iteratorMixin

  filter: mixin 'pp#filter', arrayFilterBy(util.id), hashFilterBy(util.id)
  reject: mixin 'pp#reject', arrayFilterBy(util.not), hashFilterBy(util.not)
