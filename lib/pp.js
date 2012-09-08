(function() {
  var Generator, Promise, Trampoline, contexts, metaContext, old, pp, trampoline, __;

  pp = {};

  old = this.pp;

  if (typeof module !== 'undefined') {
    module.exports = pp;
  } else {
    this.pp = pp;
  }

  pp.noConflict = function() {
    this.pp = old;
    return pp;
  };

  __ = {
    extend: function(properties) {
      var key, value;
      for (key in properties) {
        value = properties[key];
        if (properties.hasOwnProperty(key)) {
          this[key] = value;
        }
      }
      return this;
    },
    keys: Object.keys || function(any) {
      var key, _results;
      _results = [];
      for (key in any) {
        _results.push(key);
      }
      return _results;
    },
    slice: Array.prototype.slice,
    isPrimitive: function(any) {
      switch (typeof any) {
        case 'undefined':
        case 'boolean':
        case 'number':
        case 'string':
          return true;
        default:
          return any === null;
      }
    },
    isArray: Array.isArray || function(any) {
      return Object.prototype.toString.call(any) === '[object Array]';
    },
    inherit: Object.create || function(any) {
      var Inherit, copied;
      copied = any;
      if (__.isPrimitive(any)) {
        return copied;
      }
      if (__.isArray(any)) {
        return any.slice();
      }
      Inherit = function() {};
      Inherit.prototype = any.prototype;
      return new Inherit();
    },
    nothing: function() {},
    id: function(x) {
      return x;
    },
    not: function(x) {
      return !x;
    },
    defer: (function() {
      var _nextTick, _nextTimeout;
      _nextTick = function(fn) {
        var args;
        if (1 < arguments.length) {
          args = __.slice.call(arguments, 1);
          process.nextTick(function() {
            fn.apply(null, args);
          });
        } else {
          process.nextTick(fn);
        }
      };
      _nextTimeout = function(fn) {
        var args, timer;
        if (1 < arguments.length) {
          args = __.slice.call(arguments, 1);
          timer = setTimeout(function() {
            clearTimeout(timer);
            fn.apply(null, args);
          }, 0);
        } else {
          timer = setTimeout(function() {
            clearTimeout(timer);
            fn();
          }, 0);
        }
      };
      if (typeof process !== 'undefined' && typeof process.nextTick === 'function') {
        return _nextTick;
      } else {
        return _nextTimeout;
      }
    })(),
    error: {
      invalidArgument: function(api_name, any, message) {
        return new TypeError("" + api_name + " - Invalid Argument : " + any + "\n" + message);
      }
    }
  };

  pp.defer = __.defer;

  Trampoline = (function() {
    var TIME_SLICE, current, getUnixTime, invoke, limitTimeSlice, partial, procStack, register, timeLimit, timeSlice, timeStack;

    function Trampoline() {}

    TIME_SLICE = (function() {
      var rate, slices, _i, _len, _ref;
      slices = {};
      _ref = [240, 120, 75, 60, 45, 30, 27, 15, 1];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rate = _ref[_i];
        slices["FPS_" + rate] = ~~(1000 / rate);
      }
      return slices;
    })();

    procStack = [];

    timeStack = [];

    current = null;

    timeSlice = 0;

    timeLimit = 0;

    getUnixTime = Date.now || function() {
      return +new Date();
    };

    invoke = function() {
      current = procStack.shift();
      timeSlice = timeStack.shift();
      timeLimit = getUnixTime() + timeSlice;
      while (typeof current === 'function' && getUnixTime() < timeLimit) {
        current = current();
      }
      if (typeof current === 'function') {
        procStack.push(current);
        timeStack.push(timeSlice);
      }
      if (procStack.length) {
        pp.defer(invoke);
      }
    };

    limitTimeSlice = function(timeSlice) {
      if (typeof timeSlice !== 'number') {
        return TIME_SLICE.FPS_240;
      } else {
        return Math.max(timeSlice, TIME_SLICE.FPS_240);
      }
    };

    register = function(fn) {
      var args, proc, requireLength;
      requireLength = fn.length;
      if (requireLength < 1) {
        proc = fn();
      } else {
        args = __.slice.call(arguments, 1, requireLength + 1);
        proc = fn.apply(null, args);
      }
      if (typeof proc !== 'function') {
        return;
      }
      if (requireLength < arguments.length) {
        timeSlice = arguments[requireLength + 1];
      }
      procStack.push(proc);
      timeStack.push(limitTimeSlice(timeSlice));
      if (procStack.length === 1) {
        pp.defer(invoke);
      }
    };

    partial = function(fn) {
      var partialized;
      return partialized = function() {
        var args;
        args = arguments.length ? __.slice.call(arguments) : [];
        if (fn.length > args.length) {
          return partial = function() {
            if (arguments.length < 1) {
              return partial;
            }
            return partialized.apply(null, args.concat(__.slice.call(arguments)));
          };
        } else {
          args.unshift(fn);
          return register.apply(null, args);
        }
      };
    };

    Trampoline.prototype.constuctor = function() {};

    Trampoline.prototype.TIME_SLICE = TIME_SLICE;

    Trampoline.prototype.register = register;

    Trampoline.prototype.partial = partial;

    return Trampoline;

  })();

  trampoline = new Trampoline();

  pp.TIME_SLICE = trampoline.TIME_SLICE;

  Promise = (function() {
    var REJECTED, RESOLVED, UNRESOULVED, fire;

    UNRESOULVED = 'unresolved';

    RESOLVED = 'resolved';

    REJECTED = 'rejected';

    fire = trampoline.partial(function(promise, value) {
      var main;
      promise.result = value;
      return main = function() {
        var entry, proc;
        if (promise.stack.length < 1) {
          if (promise.state !== REJECTED) {
            promise.state = RESOLVED;
          }
          return;
        }
        entry = promise.stack.shift();
        proc = promise.state === REJECTED ? entry[1] : entry[0];
        if (proc) {
          try {
            promise.result = proc.call(promise.scope, promise.result);
          } catch (error) {
            promise.state = REJECTED;
            promise.result = error;
          }
        }
        return main;
      };
    });

    function Promise(scope) {
      this.state = UNRESOULVED;
      this.stack = [];
      this.scope = scope || null;
    }

    Promise.prototype.STATE = {
      UNRESOULVED: UNRESOULVED,
      RESOLVED: RESOLVED,
      REJECTED: REJECTED
    };

    Promise.prototype.resolve = function(value) {
      fire(this, value);
      return this;
    };

    Promise.prototype.reject = function(value) {
      this.state = REJECTED;
      fire(this, value);
      return this;
    };

    Promise.prototype.isResolved = function() {
      return this.state === RESOLVED;
    };

    Promise.prototype.isRejected = function() {
      return this.state === REJECTED;
    };

    Promise.prototype.then = function(success, fail, progress) {
      this.stack.push([success || null, fail || null, progress || null]);
      if (this.state !== UNRESOULVED) {
        fire(this, null);
      }
      return this;
    };

    return Promise;

  })();

  pp.promise = function(scope) {
    return new Promise(scope);
  };

  Generator = (function() {

    function Generator(continuation) {
      this.continuation = continuation;
    }

    Generator.prototype.next = function(success) {
      if (typeof success !== 'function') {
        success = __.id;
      }
      return this.continuation(function(next) {
        var args, ret;
        this.continuation = next;
        switch (arguments.length) {
          case 1:
            return success();
          case 2:
            args = arguments[1];
            ret = success(args);
            break;
          default:
            args = __.slice.call(arguments, 1);
            ret = success.apply(null, args);
        }
        if (typeof ret === 'undefined') {
          return args;
        } else {
          return ret;
        }
      });
    };

    return Generator;

  })();

  pp.generator = function(fn) {
    return new Generator(fn);
  };

  metaContext = {
    iteratorMixin: function(mixinName, arrayIterator, hashIterator) {
      var mixin;
      return mixin = function(iterator, receiver, iterable) {
        if (__.isPrimitive(iterable)) {
          receiver(__.error.invalidArgument(mixinName, iterable, 'required Array or Object as HashMap'));
          return;
        }
        if (__.isArray(iterable)) {
          return arrayIterator(iterator, receiver, iterable);
        } else {
          return hashIterator(iterator, receiver, iterable);
        }
      };
    }
  };

  contexts = {
    extend: function(params) {
      var name, proc;
      for (name in params) {
        proc = params[name];
        if (params.hasOwnProperty(name)) {
          this[name] = proc;
          if (!name.match(/^_/i)) {
            pp[name] = trampoline.partial(proc);
          }
        }
      }
      return this;
    }
  };

  pp.extend = function(contextMakers) {
    var apiName, apiProc;
    for (apiName in contextMakers) {
      apiProc = contextMakers[apiName];
      if (contextMakers.hasOwnProperty(name)) {
        contexts[name] = apiProc;
        this[api_name] = trampoline.partial(apiProc);
      }
    }
    return this;
  };

  __.extend.call(metaContext, {
    arrayEachStepBy: function(isShouldStep) {
      var makeProc;
      return makeProc = function(iterator, callback, array) {
        var LIMIT, count, finished, index, main, next;
        LIMIT = array.length;
        index = count = 0;
        finished = false;
        if (LIMIT < 1) {
          callback(null);
          return;
        }
        next = function(error) {
          var args;
          ++count;
          if (finished) {
            return;
          }
          if (count >= LIMIT || error || arguments.length > 1) {
            finished = true;
            args = 2 < arguments.length ? [] : __.slice.call(arguments, 1);
            args.unshift(error || null);
            callback.apply(null, args);
          }
        };
        return main = function() {
          if (finished) {
            return;
          }
          if (isShouldStep(index, LIMIT, count)) {
            iterator(next, array[index], index, array);
            ++index;
          }
          return main;
        };
      };
    },
    hashEachBy: function(eachProc) {
      var makeProc;
      return makeProc = function(iterator, callback, hash) {
        var hashIterator;
        hashIterator = function(next, key, index, keys) {
          iterator(next, hash[key], key, hash);
        };
        return eachProc(hashIterator, callback, __.keys(hash));
      };
    }
  });

  contexts.extend((function() {
    var fill, hashEach, meta, mixin, order, toLimit, waitCallback;
    toLimit = function(index, limit) {
      return index < limit;
    };
    waitCallback = function(index, limit, count) {
      return index < limit && index <= count;
    };
    meta = metaContext;
    mixin = meta.iteratorMixin;
    hashEach = meta.hashEachBy;
    fill = meta.arrayEachStepBy(toLimit);
    order = meta.arrayEachStepBy(waitCallback);
    return {
      _arrayEachFill: fill,
      _arrayEachOrder: order,
      each: mixin('pp#each', fill, hashEach(fill)),
      eachOrder: mixin('pp#eachOrder', order, hashEach(order))
    };
  })());

  __.extend.call(metaContext, {
    arrayMapBy: function(eachProc) {
      var makeProc;
      return makeProc = function(iterator, callback, array) {
        var after, mapping, modified, pushResult;
        modified = [];
        pushResult = null;
        mapping = function(next, value, index, iterable) {
          pushResult = function(error, result) {
            modified[index] = result;
            next(error);
          };
          iterator(pushResult, value, index, iterable);
        };
        after = function(error) {
          callback(error, modified);
        };
        return eachProc(mapping, after, array);
      };
    },
    hashMapBy: function(eachProc) {
      var makeProc;
      return makeProc = function(iterator, callback, hash) {
        var after, mapping, modified, putResult;
        modified = __.inherit(hash);
        putResult = null;
        mapping = function(next, key, index, keys) {
          putResult = function(error, result) {
            modified[key] = result;
            next(error);
          };
          iterator(putResult, hash[key], key, hash);
        };
        after = function(error) {
          callback(error, modified);
        };
        return eachProc(mapping, after, __.keys(hash));
      };
    }
  });

  contexts.extend((function() {
    var arrayMap, fill, hashMap, meta, mixin, order;
    meta = metaContext;
    mixin = meta.iteratorMixin;
    arrayMap = meta.arrayMapBy;
    hashMap = meta.hashMapBy;
    fill = contexts._arrayEachFill;
    order = contexts._arrayEachOrder;
    return {
      map: mixin('pp#map', arrayMap(fill), hashMap(fill)),
      mapOrder: mixin('pp#mapOrder', arrayMap(order), hashMap(order))
    };
  })());

  __.error.invalidFolding = function(apiName, target) {
    var errorMessage;
    if (!__.isArray(target)) {
      errorMessage = "require Array (Not Null) to folding, but " + (typeof target);
    } else if (target.length < 1) {
      errorMessage = 'Array length is 0, and without init value';
    } else {
      return;
    }
    return __.error.invalidArgument(apiName, target, errorMessage);
  };

  __.extend.call(metaContext, {
    foldBy: function(setIndex) {
      var folding;
      return folding = function(iterator, callback, init, array) {
        var accumulate, after, fold, memo;
        memo = init;
        accumulate = null;
        fold = function(next, value, index, iterable) {
          index = setIndex(index, iterable.length);
          accumulate = function(error, result) {
            memo = result;
            next(error);
          };
          iterator(accumulate, memo, iterable[index], index, iterable);
        };
        after = function(error) {
          callback(error, memo);
        };
        return contexts._arrayEachOrder(fold, after, array);
      };
    },
    foldOne: function(name, method, fold) {
      var folding;
      return folding = function(iterator, receiver, array) {
        var copied, error, init;
        error = __.error.invalidFolding(name, array);
        if (error) {
          receiver(error);
          return;
        }
        copied = array.slice();
        init = copied[method]();
        return fold(iterator, receiver, init, copied);
      };
    }
  });

  contexts.extend((function() {
    var foldLeft, foldOne, foldRight, meta, reverseIndex;
    reverseIndex = function(index, limit) {
      return limit - (index + 1);
    };
    meta = metaContext;
    foldOne = meta.foldOne;
    foldLeft = meta.foldBy(__.id);
    foldRight = meta.foldBy(reverseIndex);
    return {
      foldl: foldLeft,
      foldr: foldRight,
      foldl1: foldOne('pp#foldl1', 'shift', foldLeft),
      foldr1: foldOne('pp#foldr1', 'pop', foldRight)
    };
  })());

  metaContext.filter_by = function(tester) {
    var makeProc;
    return makeProc = function(iterator, callback, array) {
      var after, filter, pushMatched, stackMatched;
      stackMatched = [];
      pushMatched = null;
      filter = function(next, value, index) {
        pushMatched = function(error, result) {
          if (!error && tester(result)) {
            stackMatched.push(value);
          }
          next(error);
        };
        iterator(pushMatched, value, index, array);
      };
      after = function(error) {
        callback(error, stackMatched);
      };
      return contexts._arrayEachOrder(filter, after, array);
    };
  };

  contexts.extend({
    filter: metaContext.filter_by(__.id),
    reject: metaContext.filter_by(__.not)
  });

  metaContext.logical = function(test, wrapCallback) {
    var makeProc;
    return makeProc = function(iterator, receiver, iterable) {
      var afterCheck, checkIterate;
      afterCheck = null;
      checkIterate = function(next, value, key, iterable) {
        afterCheck = function(error, result) {
          if (test(result)) {
            next(error, value);
          } else {
            next(error);
          }
        };
        iterator(afterCheck, value, key, iterable);
      };
      return contexts.each(checkIterate, wrapCallback(receiver), iterable);
    };
  };

  contexts.extend((function() {
    var judgeByLength, logical;
    logical = metaContext.logical;
    judgeByLength = function(judge) {
      return function(receiver) {
        return function(error) {
          receiver(error, judge(arguments.length));
        };
      };
    };
    return {
      any: logical(__.id, judgeByLength(function(n) {
        return n > 1;
      })),
      all: logical(__.not, judgeByLength(function(n) {
        return n < 2;
      })),
      find: logical(__.id, __.id)
    };
  })());

  metaContext.until_by = function(check) {
    var makeProc;
    return makeProc = function(test, iterator, callback, init) {
      var afterTest, finished, main, mainArgs, memo, next;
      memo = __.isArray(init) ? init.slice() : [];
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
          memo = __.slice.call(arguments, 1);
        }
      };
      afterTest = function(error, result) {
        if (check(result)) {
          finished = true;
          memo.unshift(null);
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

  contexts.extend({
    whilist: metaContext.until_by(__.not),
    until: metaContext.until_by(__.id)
  });

  metaContext.doTaskBy = function(apiName, mapProc) {
    var makeProc;
    return makeProc = function(tasks, callback) {
      var iterator;
      iterator = function(next, fn) {
        var message;
        if (typeof fn !== 'function') {
          message = "required function. but include " + (typeof fn);
          next(__.error.invalidArgument(apiName, fn, message));
          return;
        }
        fn(function() {
          next.apply(null, __.slice.call(arguments));
        });
      };
      return mapProc(iterator, callback, tasks);
    };
  };

  contexts.extend({
    fill: metaContext.doTaskBy('pp#fill', contexts.map),
    order: metaContext.doTaskBy('pp#order', contexts.mapOrder)
  });

  pp.iterator = function(procs) {
    var LIMIT, iteratorCache, procByIndex;
    LIMIT = procs.length;
    if (LIMIT === 0) {
      return;
    }
    iteratorCache = [];
    procByIndex = function(index) {
      var fn;
      if (index < iteratorCache.length) {
        return iteratorCache[index];
      } else {
        fn = function() {
          procs[index].apply(procs[index], __.slice.call(arguments));
          return fn.next();
        };
        fn.next = function() {
          if (index < LIMIT - 1) {
            return procByIndex(index + 1);
          } else {
            return null;
          }
        };
        fn.clearCache = function() {
          return iteratorCache = [];
        };
        iteratorCache[index] = fn;
        return fn;
      }
    };
    return procByIndex(0);
  };

  pp.waterfall = function(procs, opt_callback) {
    var callback, finished, wrap;
    callback = opt_callback || __.id;
    finished = false;
    if (procs.length === 1) {
      callback();
      return;
    }
    wrap = function(iterator) {
      var wrapped;
      return wrapped = function(error) {
        var args, next;
        if (finished) {
          return;
        }
        if (error) {
          finished = true;
          callback(error);
          return;
        }
        args = 2 > arguments.length ? [] : __.slice.call(arguments, 1);
        next = iterator.next();
        if (next) {
          args.unshift(wrap(next));
        } else {
          args.unshift(function() {
            var results;
            results = __.slice.call(arguments);
            callback.apply(null, results);
            iterator.clearCache();
          });
        }
        return __.defer(function() {
          return iterator.apply(iterator, args);
        });
      };
    };
    return __.defer(wrap(pp.iterator(procs)));
  };

}).call(this);
