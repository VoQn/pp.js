pp = {}
old = @pp

__ = {} # internal library
metaContext = {}
contexts = {}

if typeof module isnt 'undefined'
  module.exports = pp
else
  @pp = pp

pp.noConflict = () ->
  @pp = old
  pp
