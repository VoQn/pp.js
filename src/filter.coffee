pp.extend (util) ->
  forEach = util.arrayEachOrder

  filterBy = (tester) ->
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

      forEach filter, after, array

  filter: filterBy util.id
  reject: filterBy util.not
