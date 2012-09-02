pp = {}
old = @pp

if typeof module isnt 'undefined'
  module.exports = pp
else
  @pp = pp

pp.noConflict = () ->
  @pp = old
  pp
