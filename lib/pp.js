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
  var TIME_SLICE, getUnixTime, invoke, procStack, timeStack;
  TIME_SLICE = (function() {
    var rate, slices, _i, _len, _ref;
    slices = {};
    _ref = [240, 120, 75, 60, 45, 30, 24, 15, 12, 10, 5, 2, 1];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      rate = _ref[_i];
      slices["FPS_" + rate] = Math.floor(1000 / rate);
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
  return {
    TIME_SLICE: TIME_SLICE,
    trampoline: function(fn) {
      var partialized, requireLength;
      requireLength = fn.length;
      return partialized = function() {
        var apply, args, proc, timeSlice;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (requireLength <= args.length) {
          proc = fn.apply(null, args.slice(0, requireLength));
          if (proc === void 0) {
            return;
          }
          timeSlice = requireLength < args.length ? args[requireLength] : null;
          if (typeof timeSlice !== 'number') {
            timeSlice = TIME_SLICE.FPS_240;
          } else if (timeSlice < TIME_SLICE.FPS_240) {
            timeSlice = TIME_SLICE.FPS_240;
          }
          procStack.push(proc);
          timeStack.push(timeSlice);
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
  var argError, expectBut, genEnumerator;
  expectBut = function(identifer, expected, actual) {
    return "" + identifer + " required a " + expected + ", but " + (typeof actual);
  };
  argError = function(apiName) {
    return function(subject, message) {
      return util.invalidArgumentError(apiName, apiName);
    };
  };
  genEnumerator = {
    array: {
      genState: function(array) {
        return {
          source: array,
          limit: array.length,
          stored: [],
          count: 0,
          hasFinished: false
        };
      },
      fill: function(iterator, genCallback, state) {
        var index, iterable, limit, main, value;
        index = 0;
        value = null;
        limit = state.limit;
        iterable = state.source;
        return main = function() {
          if (state.hasFinished) {
            return;
          }
          if (index < limit) {
            value = iterable[index];
            iterator(genCallback(value, index), value, index, iterable);
            ++index;
          }
          return main;
        };
      },
      order: function(iterator, genCallback, state) {
        var index, iterable, limit, main, value;
        index = 0;
        value = null;
        limit = state.limit;
        iterable = state.source;
        return main = function() {
          if (state.hasFinished) {
            return;
          }
          if (state.count >= index && index < limit) {
            value = iterable[index];
            iterator(genCallback(value, index), value, index, iterable);
            ++index;
          }
          return main;
        };
      }
    },
    hash: {
      genState: function(hash) {
        var keys;
        keys = util.keys(hash);
        return {
          source: hash,
          keys: keys,
          limit: keys.length,
          stored: {},
          count: 0,
          hasFinished: false
        };
      },
      fill: function(iterator, genCallback, state) {
        var index, iterable, key, keys, limit, main, value;
        index = 0;
        key = '';
        value = null;
        keys = state.keys;
        limit = state.limit;
        iterable = state.source;
        return main = function() {
          if (state.hasFinished) {
            return;
          }
          if (index < limit) {
            key = keys[index];
            value = iterable[key];
            iterator(genCallback(value, key), value, key, iterable);
            ++index;
          }
          return main;
        };
      },
      order: function(iterator, genCallback, state) {
        var index, iterable, key, keys, limit, main, value;
        index = 0;
        key = '';
        value = null;
        keys = state.keys;
        limit = state.limit;
        iterable = state.source;
        return main = function() {
          if (state.hasFinished) {
            return;
          }
          if (state.count >= index && index < limit) {
            key = keys[index];
            value = iterable[key];
            iterator(genCallback(value, key), value, key, iterable);
            ++index;
          }
          return main;
        };
      }
    },
    combine: function(iterableType, loopType, genIterator) {
      var genLoop, genState;
      genState = this[iterableType].genState;
      genLoop = this[iterableType][loopType];
      return function(iterator, callback, iterable) {
        var genCallback, state;
        state = genState(iterable);
        genCallback = genIterator(callback, state, state.limit, state.stored);
        return genLoop(iterator, genCallback, state);
      };
    }
  };
  return {
    _expectBut: expectBut,
    _iteratorMixin: function(mixinName, loopType, genForArray, genForHash) {
      var forArray, forHash, mismatch;
      forArray = genEnumerator.combine('array', loopType, genForArray);
      forHash = genEnumerator.combine('hash', loopType, genForHash || genForArray);
      mismatch = argError(mixinName);
      return function(iterator, callback, iterable) {
        if (typeof callback !== 'function') {
          throw mismatch(callback, expectBut('callback', 'function', callback));
          return;
        }
        if (typeof iterator !== 'function') {
          callback(mismatch(iterator, expectBut('iterator', 'function', iterator)));
          return;
        }
        if (util.isPrimitive(iterable)) {
          callback(mismatch(iterable, expectBut('iterable', 'Array or Object', iterable)));
          return;
        }
        if (util.isArray(iterable)) {
          if (1 > iterable.length) {
            callback(null, []);
            return;
          }
          return forArray(iterator, callback, iterable);
        }
        if (1 > util.keys(iterable).length) {
          callback(null, {});
          return;
        }
        return forHash(iterator, callback, iterable);
      };
    }
  };
});

pp.extend(function(util) {
  var genEach;
  genEach = function(callback, state, limit) {
    var next;
    next = function(error) {
      if (state.hasFinished) {
        return;
      }
      if (error || ++state.count >= limit) {
        state.hasFinished = true;
        callback(error || null);
      }
    };
    return function() {
      return next;
    };
  };
  return util.trampolines({
    each: util.iteratorMixin('pp#each', 'fill', genEach),
    eachOrder: util.iteratorMixin('pp#eachOrder', 'order', genEach)
  });
});

pp.extend(function(util) {
  var genMapper;
  genMapper = function(callback, state, limit, stored) {
    return function(_, key) {
      return function(error, result) {
        if (state.hasFinished) {
          return;
        }
        stored[key] = result;
        if (error || ++state.count >= limit) {
          state.hasFinished = true;
          callback(error, stored);
        }
      };
    };
  };
  return util.trampolines({
    map: util.iteratorMixin('pp#map', 'fill', genMapper),
    mapOrder: util.iteratorMixin('pp#mapOrder', 'order', genMapper)
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
    } else if (1 > target.length) {
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
      var accumulate, count, finished, folding, index, key, limit, main, memo, selected;
      memo = init;
      index = count = selected = 0;
      finished = false;
      limit = array.length;
      accumulate = key = null;
      folding = function(value, index, iterable) {
        accumulate = function(error, result) {
          if (finished) {
            return;
          }
          memo = result;
          if (error || ++count >= limit) {
            finished = true;
            callback(error, memo);
          }
        };
        iterator(accumulate, memo, value, index, iterable);
      };
      return main = function() {
        if (finished) {
          return;
        }
        if (count >= index && index < limit) {
          key = selectIndex(index, limit);
          folding(array[key], key, array);
          ++index;
        }
        return main;
      };
    };
    getInit = direction.getInit;
    fold1Name = direction.name + '1';
    return {
      withInit: function(iterator, receiver, init, array) {
        if (typeof receiver !== 'function') {
          throw new Error("callback is not function: " + (typeof receiver));
          return;
        }
        if (typeof iterator !== 'function') {
          receiver(new Error("iterator is not function: " + (typeof iterator)));
          return;
        }
        if (!util.isArray(array)) {
          receiver(new Error("foldable should kind of Array list"));
          return;
        }
        if (1 > array.length) {
          receiver(null, init);
          return;
        }
        return foldArray(iterator, receiver, init, array);
      },
      withoutInit: function(iterator, receiver, array) {
        var copied, error, init;
        error = validateFoldOne(fold1Name, array);
        if (error) {
          return receiver(error);
        }
        copied = array.slice();
        init = copied[getInit]();
        if (1 > copied.length) {
          receiver(null, init);
          return;
        }
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
  var arrayFilter, arrayReject, hashFilter, hashReject;
  arrayFilter = function(callback, state, limit, stored) {
    return function(value) {
      return function(error, result) {
        if (state.hasFinished) {
          return;
        }
        if (result) {
          stored.push(value);
        }
        if (error || ++state.count >= limit) {
          state.hasFinished = true;
          callback(error, stored);
        }
      };
    };
  };
  hashFilter = function(callback, state, limit, stored) {
    return function(value, key) {
      return function(error, result) {
        if (state.hasFinished) {
          return;
        }
        if (result) {
          stored[key] = value;
        }
        if (error || ++state.count >= limit) {
          state.hasFinished = true;
          callback(error, stored);
        }
      };
    };
  };
  arrayReject = function(callback, state, limit, stored) {
    return function(value) {
      return function(error, result) {
        if (state.hasFinished) {
          return;
        }
        if (!result) {
          stored.push(value);
        }
        if (error || ++state.count >= limit) {
          state.hasFinished = true;
          callback(error, stored);
        }
      };
    };
  };
  hashReject = function(callback, state, limit, stored) {
    return function(value, key) {
      return function(error, result) {
        if (state.hasFinished) {
          return;
        }
        if (!result) {
          stored[key] = value;
        }
        if (error || ++state.count >= limit) {
          state.hasFinished = true;
          callback(error, stored);
        }
      };
    };
  };
  return util.trampolines({
    filter: util.iteratorMixin('pp#filter', 'order', arrayFilter, hashFilter),
    reject: util.iteratorMixin('pp#reject', 'order', arrayReject, hashReject)
  });
});

pp.extend(function(util) {
  var detect, every, some;
  some = function(callback, state, limit) {
    var next;
    next = function(error, result) {
      if (state.hasFinished) {
        return;
      }
      if (error || result || ++state.count >= limit) {
        state.hasFinished = true;
        callback(error || null, result || false);
      }
    };
    return function() {
      return next;
    };
  };
  every = function(callback, state, limit) {
    var next;
    next = function(error, result) {
      if (state.hasFinished) {
        return;
      }
      if (error || !result) {
        state.hasFinished = true;
        callback(error || null, false);
        return;
      }
      if (++state.count >= limit) {
        state.hasFinished = true;
        callback(null, true);
      }
    };
    return function() {
      return next;
    };
  };
  detect = function(callback, state, limit) {
    return function(value, key) {
      return function(error, result) {
        if (state.hasFinished) {
          return;
        }
        if (result) {
          state.hasFinished = true;
          callback(error || null, value, key);
          return;
        }
        if (error || ++state.count >= limit) {
          state.hasFinished = true;
          callback(error || null);
        }
      };
    };
  };
  return util.trampolines({
    any: util.iteratorMixin('pp#any', 'fill', some),
    all: util.iteratorMixin('pp#all', 'fill', every),
    find: util.iteratorMixin('pp#find', 'fill', detect)
  });
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
