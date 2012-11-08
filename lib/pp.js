var internal, old, pp, root,
  __hasProp = {}.hasOwnProperty,
  __slice = [].slice;

root = this;

pp = {};

old = root.pp;

if (typeof module === 'object') {
  module.exports = pp;
} else {
  root.pp = pp;
}

pp.noConflict = function() {
  root.pp = old;
  return pp;
};

internal = {};

pp.extend = function(contextMaker) {
  var isInternal, name, proc, reference;
  reference = typeof contextMaker === 'function' ? contextMaker(internal) : contextMaker;
  for (name in reference) {
    if (!__hasProp.call(reference, name)) continue;
    proc = reference[name];
    isInternal = name.match(/^_/);
    if (isInternal) {
      internal[name.substring(1)] = proc;
    } else {
      this[name] = proc;
    }
  }
  return this;
};

pp.extend(function(util) {
  var isArray, isPrimitive, nextTick, nextTimeout;
  isPrimitive = function(any) {
    switch (typeof any) {
      case 'undefined':
      case 'boolean':
      case 'number':
      case 'string':
        return true;
      default:
        return any === null;
    }
  };
  isArray = Array.isArray || function(any) {
    return toString.call(any) === '[object Array]';
  };
  nextTick = function() {
    var args, fn;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    process.nextTick(function() {
      fn.apply(null, args);
    });
  };
  nextTimeout = function() {
    var args, fn, timer;
    fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    timer = setTimeout(function() {
      clearTimeout(timer);
      fn.apply(null, args);
    }, 0);
  };
  return {
    _isPrimitive: isPrimitive,
    _isArray: isArray,
    _keys: Object.keys || function(any) {
      var key, _results;
      _results = [];
      for (key in any) {
        if (!__hasProp.call(any, key)) continue;
        _results.push(key);
      }
      return _results;
    },
    _inherit: Object.create || function(any) {
      var Inherit, copied;
      copied = any;
      if (isPrimitive(any)) {
        return copied;
      }
      if (isArray(any)) {
        return [];
      }
      if (toString.call(any) === '[object Object]') {
        return {};
      }
      Inherit = function() {};
      Inherit.prototype = any.prototype;
      return new Inherit();
    },
    _slice: [].slice,
    _nothing: function() {},
    _id: function(x) {
      return x;
    },
    _not: function(x) {
      return !x;
    },
    defer: process && typeof process.nextTick === 'function' ? nextTick : nextTimeout,
    _invalidArgumentError: function(api_name, any, message) {
      return new TypeError("" + api_name + " - Invalid Argument : " + any + "\n" + message);
    },
    _sync: {
      map: function(iterator, list) {
        var item, _i, _len, _results;
        _results = [];
        for (_i = 0, _len = list.length; _i < _len; _i++) {
          item = list[_i];
          _results.push(iterator(item));
        }
        return _results;
      }
    }
  };
});

pp.extend(function(util) {
  var TIME_SLICE, getUnixTime, invoke, limitTimeSlice, procStack, timeStack;
  TIME_SLICE = (function() {
    var rate, slices, _i, _len, _ref;
    slices = {};
    _ref = [240, 120, 75, 60, 45, 30, 24, 15, 12, 10, 5, 2, 1];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rate = _ref[_i];
      slices["FPS_" + rate] = ~~(1000 / rate);
    }
    return slices;
  })();
  getUnixTime = Date.now || function() {
    return +new Date();
  };
  procStack = [];
  timeStack = [];
  invoke = function() {
    var procedure, timeLimit, timeSlice;
    if (!procStack.length) {
      return;
    }
    procedure = procStack.shift();
    timeSlice = timeStack.shift();
    timeLimit = getUnixTime() + timeSlice;
    while (typeof procedure === 'function' && getUnixTime() < timeLimit) {
      procedure = procedure();
    }
    if (typeof procedure === 'function') {
      procStack.push(procedure);
      timeStack.push(timeSlice);
    }
    pp.defer(invoke);
  };
  limitTimeSlice = function(timeSlice) {
    if (typeof timeSlice !== 'number') {
      return TIME_SLICE.FPS_240;
    } else {
      return Math.max(timeSlice, TIME_SLICE.FPS_240);
    }
  };
  return {
    TIME_SLICE: TIME_SLICE,
    trampoline: function(fn) {
      var partialized, requireLength;
      requireLength = fn.length;
      return partialized = function() {
        var apply, args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (requireLength <= args.length) {
          procStack.push(fn.apply(null, args.slice(0, requireLength)));
          timeStack.push(limitTimeSlice(requireLength < args.length ? args[requireLength] : null));
          if (procStack.length === 1) {
            pp.defer(invoke);
          }
          return;
        }
        return apply = function() {
          var adds;
          adds = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          if (adds.length < 1) {
            return apply;
          }
          return partialized.apply(null, args.concat(adds));
        };
      };
    },
    _trampolines: function(procedures) {
      var name, proc, trampolines;
      trampolines = {};
      for (name in procedures) {
        if (!__hasProp.call(procedures, name)) continue;
        proc = procedures[name];
        if (name.match(/^_/)) {
          trampolines[name] = proc;
        } else {
          trampolines["_" + name] = proc;
          trampolines[name] = pp.trampoline(proc);
        }
      }
      return trampolines;
    }
  };
});

pp.extend(function(util) {
  var PROGRESS, Promise, REJECTED, RESOLVED, UNRESOULVED, fire, xOrNull;
  UNRESOULVED = 'unresolved';
  PROGRESS = 'progress';
  RESOLVED = 'resolved';
  REJECTED = 'rejected';
  fire = pp.trampoline(function(promise, value) {
    var callback, main, taskIndex;
    taskIndex = 0;
    promise.results = [value];
    callback = function() {
      var error, results;
      error = arguments[0], results = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (error) {
        promise.state = REJECTED;
        promise.results = [error];
        return;
      }
      promise.results = results;
    };
    main = function() {
      var entry, proc;
      if (promise.stack.length <= taskIndex) {
        if (promise.state !== REJECTED) {
          promise.state = RESOLVED;
        }
        return;
      }
      entry = promise.stack[taskIndex++];
      proc = promise.state === REJECTED ? entry[1] : entry[0];
      if (proc) {
        promise.results.unshift(callback);
        proc.apply(promise.scope, promise.results);
      }
      return main;
    };
    return main;
  });
  xOrNull = function(x) {
    return x || null;
  };
  Promise = (function() {

    function Promise(scope) {
      this.state = UNRESOULVED;
      this.stack = [];
      this.scope = xOrNull(scope);
    }

    Promise.prototype.STATE = {
      UNRESOULVED: UNRESOULVED,
      PROGRESS: PROGRESS,
      RESOLVED: RESOLVED,
      REJECTED: REJECTED
    };

    Promise.prototype.resolve = function(value) {
      this.state = PROGRESS;
      fire(this, value);
      return this;
    };

    Promise.prototype.reject = function(value) {
      this.state = REJECTED;
      fire(this, value);
      return this;
    };

    Promise.prototype.isProgress = function() {
      return this.state === PROGRESS;
    };

    Promise.prototype.isResolved = function() {
      return this.state === RESOLVED;
    };

    Promise.prototype.isRejected = function() {
      return this.state === REJECTED;
    };

    Promise.prototype.next = function(success, fail, progress) {
      this.stack.push(util.sync.map(xOrNull, [success, fail, progress]));
      if (this.state !== UNRESOULVED) {
        fire(this, null);
      }
      return this;
    };

    Promise.prototype.then = function(success, fail, progress) {
      var wrap,
        _this = this;
      wrap = function(f) {
        if (f == null) {
          return null;
        } else {
          return function() {
            var args, next, r;
            next = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
            try {
              r = f.apply(_this.scope, args);
              next(null, r);
            } catch (error) {
              next(error);
            }
          };
        }
      };
      this.stack.push(util.sync.map(wrap, [success, fail, progress]));
      if (this.state !== UNRESOULVED) {
        fire(this, null);
      }
      return this;
    };

    return Promise;

  })();
  return {
    promise: function(scope) {
      return new Promise(scope);
    }
  };
});

pp.extend(function(util) {
  var Generator;
  Generator = (function() {

    function Generator(continuation, initialize, changeState) {
      this.continuation = continuation;
      this.initialize = initialize || util.nothing;
      this.changeState = changeState || util.nothing;
    }

    Generator.prototype.next = function(success) {
      if (typeof success !== 'function') {
        success = util.id;
      }
      return this.continuation(function() {
        var args, next, ret;
        next = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        this.continuation = next;
        ret = success.apply(null, args) || (args.length === 1 ? args[0] : args);
        return ret;
      });
    };

    Generator.prototype.reset = function() {
      var ret, values;
      values = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      ret = this.initialize.apply(this, [
        function() {
          var args, next;
          next = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          this.continuation = next;
          if (args.length === 1) {
            return args[0];
          } else {
            return args;
          }
        }
      ].concat(values));
      return ret;
    };

    Generator.prototype.jump = function() {
      var ret, values;
      values = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      ret = this.changeState.apply(this, [
        function() {
          var args, next;
          next = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          this.continuation = next;
          if (args.length === 1) {
            return args[0];
          } else {
            return args;
          }
        }
      ].concat(values));
      return ret;
    };

    return Generator;

  })();
  return {
    generator: function(continuation, initialize, changeState) {
      return new Generator(continuation, initialize, changeState);
    }
  };
});

pp.extend(function(util) {
  var expectBut;
  expectBut = function(identifer, expected, actual) {
    return "" + identifer + " required a " + expected + ", but " + (typeof actual);
  };
  return {
    _validateIteration: function(name, iteration) {
      var validated;
      return validated = function(iterator, callback, iterable) {
        var argError;
        argError = util.invalidArgumentError;
        if (typeof callback !== 'function') {
          throw argError(name, callback, expectBut('callback', 'function', callback));
          return;
        }
        if (typeof iterator !== 'function') {
          callback(argError(name, iterator, expectBut('iterator', 'function', iterator)));
          return;
        }
        if (util.isPrimitive(iterable)) {
          callback(argError(name, iterable, expectBut('iterable', 'Array or Object (as HashTable)', iterable)));
          return;
        }
        return iteration(iterator, callback, iterable);
      };
    },
    _iteratorMixin: function(mixinName, arrayIterator, hashIterator) {
      var mixin;
      return mixin = util.validateIteration(mixinName, function(iterator, callback, iterable) {
        if (util.isArray(iterable)) {
          return arrayIterator(iterator, callback, iterable);
        } else {
          return hashIterator(iterator, callback, iterable);
        }
      });
    }
  };
});

pp.extend(function(util) {
  var forEach, stepBy;
  stepBy = function(isReady) {
    var arrayForEach;
    return arrayForEach = function(iterator, callback, array) {
      var count, finished, index, main, next;
      if (!array.length) {
        return callback(null);
      }
      index = count = 0;
      finished = false;
      next = function(error) {
        var args;
        if (finished) {
          return;
        }
        if (error || 1 < arguments.length || ++count >= array.length) {
          finished = true;
          args = util.slice.call(arguments);
          args[0] = error || null;
          callback.apply(null, args);
        }
      };
      return main = function() {
        if (finished) {
          return;
        }
        if (isReady(index, array.length, count)) {
          iterator(next, array[index], index, array);
          ++index;
        }
        return main;
      };
    };
  };
  forEach = {
    fill: stepBy(function(index, limit) {
      return index < limit;
    }),
    order: stepBy(function(index, limit, count) {
      return index === count && index < limit;
    }),
    array: function(type) {
      return this[type];
    },
    hash: function(type) {
      if (this.hash[type]) {
        return this.hash[type];
      }
      return this.hash[type] = function(iterator, callback, hash) {
        var hashIterator;
        hashIterator = function(next, key) {
          iterator(next, hash[key], key, hash);
        };
        return forEach[type](hashIterator, callback, util.keys(hash));
      };
    },
    mixin: function(name, type) {
      return util.iteratorMixin(name, this.array(type), this.hash(type));
    }
  };
  return util.trampolines({
    _forEach: forEach,
    each: forEach.mixin('pp#each', 'fill'),
    eachOrder: forEach.mixin('pp#eachOrder', 'order')
  });
});

pp.extend(function(util) {
  var map;
  map = {
    arrayMap: function(forEach) {
      var arrayMap;
      return arrayMap = function(iterator, callback, array) {
        var after, mapping, modified;
        modified = [];
        mapping = function(next, value, index, iterable) {
          var collect;
          collect = function(error, result) {
            modified[index] = result;
            next(error);
          };
          iterator(collect, value, index, iterable);
        };
        after = function(error) {
          callback(error, modified);
        };
        return forEach(mapping, after, array);
      };
    },
    hashMap: function(forEach) {
      var hashMap;
      return hashMap = function(iterator, callback, hash) {
        var after, mapping, modified;
        modified = {};
        mapping = function(next, key, index, keys) {
          var collect;
          collect = function(error, result) {
            modified[key] = result;
            next(error);
          };
          iterator(collect, hash[key], key, hash);
        };
        after = function(error) {
          callback(error, modified);
        };
        return forEach(mapping, after, util.keys(hash));
      };
    },
    mixin: function(name, type) {
      var forEach;
      forEach = util.forEach[type];
      return util.iteratorMixin(name, this.arrayMap(forEach), this.hashMap(forEach));
    }
  };
  return util.trampolines({
    map: map.mixin('pp#map', 'fill'),
    mapOrder: map.mixin('pp#mapOrder', 'order')
  });
});

pp.extend(function(util) {
  var direction, fold, foldingFrom, validateFoldOne;
  direction = {
    left: {
      name: 'pp#foldl',
      selectIndex: util.id,
      getInit: 'shift'
    },
    right: {
      name: 'pp#foldr',
      selectIndex: function(index, limit) {
        return limit - (index + 1);
      },
      getInit: 'pop'
    }
  };
  validateFoldOne = function(name, target) {
    var message;
    if (!util.isArray(target)) {
      message = "require Array (Not Null) to folding, but " + (typeof target);
    } else if (!target.length) {
      message = 'Array length is 0, and without init value';
    } else {
      return;
    }
    return util.invalidArgumentError(name, target, message);
  };
  foldingFrom = function(direction) {
    var fold1Name, foldArray, getInit, selectIndex;
    selectIndex = direction.selectIndex;
    foldArray = function(iterator, callback, init, array) {
      var after, folding, memo;
      memo = init;
      folding = function(next, value, index, iterable) {
        var accumulate;
        index = selectIndex(index, iterable.length);
        accumulate = function(error, result) {
          memo = result;
          next(error);
        };
        iterator(accumulate, memo, iterable[index], index, iterable);
      };
      after = function(error) {
        callback(error, memo);
      };
      return util.forEach.order(folding, after, array);
    };
    getInit = direction.getInit;
    fold1Name = direction.name + '1';
    return {
      withInit: foldArray,
      withoutInit: function(iterator, receiver, array) {
        var copied, error, init;
        error = validateFoldOne(fold1Name, array);
        if (error) {
          return receiver(error);
        }
        copied = array.slice();
        init = copied[getInit]();
        return foldArray(iterator, receiver, init, copied);
      }
    };
  };
  fold = {
    left: foldingFrom(direction.left),
    right: foldingFrom(direction.right)
  };
  return util.trampolines({
    foldl: fold.left.withInit,
    foldr: fold.right.withInit,
    foldl1: fold.left.withoutInit,
    foldr1: fold.right.withoutInit
  });
});

pp.extend(function(util) {
  var filter;
  filter = {
    array: function(tester) {
      var arrayFilter;
      return arrayFilter = function(iterator, callback, array) {
        var after, filtering, matched;
        matched = [];
        filtering = function(next, value, index) {
          var collect;
          collect = function(error, result) {
            if (tester(result)) {
              matched.push(value);
            }
            next(error);
          };
          return iterator(collect, value, index, array);
        };
        after = function(error) {
          callback(error, matched);
        };
        return util.forEach.order(filtering, after, array);
      };
    },
    hash: function(tester) {
      var hashFilter;
      return hashFilter = function(iterator, callback, hash) {
        var after, filtering, matched;
        matched = {};
        filtering = function(next, key, index, keys) {
          var collect;
          collect = function(error, result) {
            if (tester(result)) {
              matched[key] = hash[key];
            }
            next(error);
          };
          iterator(collect, hash[key], key, hash);
        };
        after = function(error) {
          callback(error, matched);
        };
        return util.forEach.order(filtering, after, util.keys(hash));
      };
    },
    mixin: function(name, tester) {
      return util.iteratorMixin(name, this.array(tester), this.hash(tester));
    }
  };
  return util.trampolines({
    filter: filter.mixin('pp#filter', util.id),
    reject: filter.mixin('pp#reject', util.not)
  });
});

pp.extend(function(util) {
  var forEach, name, predicators, proc, validates;
  forEach = function(iterator, callback, iterable) {
    if (util.isArray(iterable)) {
      return util.forEach.fill(iterator, callback, iterable);
    } else {
      return util.forEach.hash.fill(iterator, callback, iterable);
    }
  };
  predicators = {
    any: function(iterator, callback, iterable) {
      var after, check;
      check = function(next, value, key, iterable) {
        var collect;
        collect = function(error, result) {
          if (result) {
            next(error, result, key);
          } else {
            next(error);
          }
        };
        iterator(collect, value, key, iterable);
      };
      after = function(error, result, key) {
        if (arguments.length < 2) {
          callback(error, false);
        } else {
          callback(error, result, key);
        }
      };
      return forEach(check, after, iterable);
    },
    all: function(iterator, callback, iterable) {
      var after, check;
      check = function(next, value, key, iterable) {
        var collect;
        collect = function(error, result) {
          if (result) {
            next(error);
          } else {
            next(error, result, key);
          }
        };
        iterator(collect, value, key, iterable);
      };
      after = function(error, result, key) {
        if (arguments.length < 2) {
          callback(error, true);
        } else {
          callback(error, false, key);
        }
      };
      return forEach(check, after, iterable);
    },
    find: function(iterator, callback, iterable) {
      var after, check;
      check = function(next, value, key, iterable) {
        var collect;
        collect = function(error, result) {
          if (result) {
            next(error, value, key);
          } else {
            next(error);
          }
        };
        iterator(collect, value, key, iterable);
      };
      after = function(error, value, key) {
        if (arguments.length < 2) {
          callback(error);
        } else {
          callback(error, value, key);
        }
      };
      return forEach(check, after, iterable);
    }
  };
  validates = {};
  for (name in predicators) {
    if (!__hasProp.call(predicators, name)) continue;
    proc = predicators[name];
    validates[name] = util.validateIteration("pp#" + name, proc);
  }
  return util.trampolines(validates);
});

pp.extend(function(util) {
  var untilBy;
  untilBy = function(check) {
    var cpsLoop;
    return cpsLoop = function(test, iterator, callback, init) {
      var afterTest, finished, main, mainArgs, memo, next;
      memo = util.isArray(init) ? init.slice() : [];
      finished = false;
      next = function(error) {
        if (finished) {
          return;
        }
        if (error) {
          finished = true;
          callback(error);
          return;
        }
        if (arguments.length > 1) {
          memo = util.slice.call(arguments, 1);
        }
      };
      afterTest = function(error, result) {
        if (error || check(result)) {
          finished = true;
          memo.unshift(error || null);
          callback.apply(null, memo);
          return;
        }
        memo.unshift(next);
        iterator.apply(null, memo);
      };
      mainArgs = [afterTest];
      return main = function() {
        if (finished) {
          return;
        }
        test.apply(null, mainArgs.concat(memo));
        return main;
      };
    };
  };
  return util.trampolines({
    whilist: untilBy(util.not),
    until: untilBy(util.id)
  });
});

pp.extend(function(util) {
  var doTaskBy;
  doTaskBy = function(name, mapping) {
    var cpsIterate;
    return cpsIterate = function(tasks, callback) {
      var iterator;
      iterator = function(next, fn) {
        var message;
        if (typeof fn !== 'function') {
          message = "required function. but include " + (typeof fn);
          next(util.invalidArgumentError(name, fn, message));
          return;
        }
        fn(function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          next.apply(null, args);
        });
      };
      return mapping(iterator, callback, tasks);
    };
  };
  return util.trampolines({
    fill: doTaskBy('pp#fill', util.map),
    order: doTaskBy('pp#order', util.mapOrder)
  });
});

pp.extend(function(util) {
  return {
    iterator: function(procs) {
      var cache, limit, procedureByIndex;
      if (!(limit = procs.length)) {
        return;
      }
      cache = [];
      procedureByIndex = function(index) {
        var procedure;
        if (index < cache.length) {
          return cache[index];
        }
        procedure = function() {
          var args;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          procs[index].apply(procs[index], args);
          return procedure.next();
        };
        procedure.next = function() {
          if (index < limit - 1) {
            return procedureByIndex(index + 1);
          } else {
            return null;
          }
        };
        procedure.clearCache = function() {
          cache = [];
        };
        cache[index] = procedure;
        return procedure;
      };
      return procedureByIndex(0);
    },
    waterfall: pp.trampoline(function(procs, callback) {
      var count, finished, index, limit, main, memories, next;
      if (!procs.length) {
        return callback();
      }
      index = count = 0;
      limit = procs.length;
      memories = [];
      finished = false;
      next = function() {
        var error, results;
        error = arguments[0], results = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        if (finished) {
          return;
        }
        memories = results || [];
        if (error || ++count >= limit) {
          finished = true;
          memories.unshift(error || null);
          callback.apply(null, memories);
        }
      };
      return main = function() {
        if (finished) {
          return;
        }
        if (index >= count && index < limit) {
          memories.unshift(next);
          procs[index++].apply(null, memories);
        }
        return main;
      };
    })
  };
});
