metaContext.filter_by = (tester) ->
  makeProc = (iterator, callback, array) ->
    stackMatched = []
    pushMatched  = null

    filter = (next, value, index) ->
      pushMatched = (error, result) ->
        stackMatched.push value if not error and tester result
        next error
        return
      iterator pushMatched, value, index, array
      return

    after = (error) ->
      callback error, stackMatched
      return

    contexts._arrayEachOrder filter, after, array

contexts.extend
  filter: metaContext.filter_by __.id
  reject: metaContext.filter_by __.not
