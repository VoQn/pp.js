metaContext.logical = (test, wrap_callback) ->
  make_proc = (iterator, receiver, iterable) ->
    after_check   = null

    check_iterate = (next, value, key, iterable) ->
      after_check = (error, result) ->
        if test result then next error, value else next error
        return
      iterator after_check, value, key, iterable
      return

    contexts.each check_iterate, wrap_callback(receiver), iterable

contexts.extend do ->
  logical = metaContext.logical
  judge_by_length = (judge) -> (receiver) -> (error) ->
    receiver error, judge arguments.length
    return

  any:  logical(__.id, judge_by_length (n) -> n > 1)
  all:  logical(__.not, judge_by_length (n) -> n < 2)
  find: logical(__.id, __.id)
