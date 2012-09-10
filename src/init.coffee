root = @
pp = {}
old = root.pp

if typeof module is 'object'
  module.exports = pp
else
  root.pp = pp

pp.noConflict = () ->
  root.pp = old
  pp
