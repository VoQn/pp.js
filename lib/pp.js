(function() {
  var Generator, Promise, contexts, old, pp, trampoline, __,
    __slice = [].slice;

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
      var nextTick, nextTimeout;
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
      if (typeof process !== 'undefined' && typeof process.nextTick === 'function') {
        return nextTick;
      } else {
        return nextTimeout;
      }
    })(),
    error: {
      invalidArgument: function(api_name, any, message) {
        return new TypeError("" + api_name + " - Invalid Argument : " + any + "\n" + message);
      }
    }
  };

  pp.defer = __.defer;

  trampoline = (function() {
    var TIME_SLICE, current, getUnixTime, invoke, limitTimeSlice, partial, procStack, register, timeLimit, timeSlice, timeStack;
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
    register = function() {
      var args, fn, proc, requireLength;
      fn = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      requireLength = fn.length;
      proc = fn.apply(null, args.slice(0, requireLength));
      if (typeof proc !== 'function') {
        return;
      }
      if (requireLength < args.length) {
        timeSlice = args[requireLength];
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
        var args, partialApply;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (fn.length > args.length) {
          return partialApply = function() {
            var adds;
            adds = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            if (adds.length < 1) {
              return partialApply;
            }
            return partialized.apply(null, args.concat(adds));
          };
        } else {
          args.unshift(fn);
          return register.apply(null, args);
        }
      };
    };
    return {
      TIME_SLICE: TIME_SLICE,
      register: register,
      partial: partial
    };
  })();

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
      return this.continuation(function() {
        var args, next, ret;
        next = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        this.continuation = next;
        ret = success.apply(null, args) || (args.length === 1 ? args[0] : args);
        return ret;
      });
    };

    return Generator;

  })();

  pp.generator = function(fn) {
    return new Generator(fn);
  };

  contexts = {
    _iteratorMixin: function(mixinName, arrayIterator, hashIterator) {
      var mixin;
      return mixin = function(iterator, receiver, iterable) {
        if (__.isPrimitive(iterable)) {
          return receiver(__.error.invalidArgument(mixinName, iterable, 'required Array or Object as HashMap'));
        }
        if (__.isArray(iterable)) {
          return arrayIterator(iterator, receiver, iterable);
        } else {
          return hashIterator(iterator, receiver, iterable);
        }
      };
    },
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

  contexts.extend((function() {
    var arrayEachStepBy, fill, hashEachBy, mixin, order, toLimit, waitCallback;
    arrayEachStepBy = function(isShouldStep) {
      var cpsEach;
      return cpsEach = function(iterator, callback, array) {
        var count, finished, index, limit, main, next;
        limit = array.length;
        if (limit < 1) {
          return callback(null);
        }
        index = count = 0;
        finished = false;
        next = function() {
          var args, error;
          error = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          ++count;
          if (finished) {
            return;
          }
          if (count >= limit || error || args.length) {
            finished = true;
            args.unshift(error || null);
            callback.apply(null, args);
          }
        };
        return main = function() {
          if (finished) {
            return;
          }
          if (isShouldStep(index, limit, count)) {
            iterator(next, array[index], index, array);
            ++index;
          }
          return main;
        };
      };
    };
    hashEachBy = function(eachProc) {
      var cpsEach;
      return cpsEach = function(iterator, callback, hash) {
        var hashIterator;
        hashIterator = function(next, key, index, keys) {
          iterator(next, hash[key], key, hash);
        };
        return eachProc(hashIterator, callback, __.keys(hash));
      };
    };
    toLimit = function(index, limit) {
      return index < limit;
    };
    waitCallback = function(index, limit, count) {
      return index < limit && index <= count;
    };
    mixin = contexts._iteratorMixin;
    fill = arrayEachStepBy(toLimit);
    order = arrayEachStepBy(waitCallback);
    return {
      _arrayEachFill: fill,
      _arrayEachOrder: order,
      each: mixin('pp#each', fill, hashEachBy(fill)),
      eachOrder: mixin('pp#eachOrder', order, hashEachBy(order))
    };
  })());

  contexts.extend((function() {
    var arrayMapBy, fill, hashMapBy, mixin, order;
    arrayMapBy = function(eachProc) {
      var cpsMap;
      return cpsMap = function(iterator, callback, array) {
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
    };
    hashMapBy = function(eachProc) {
      var cpsMap;
      return cpsMap = function(iterator, callback, hash) {
        var after, mapping, modified, putResult;
        modified = __.inherit(hash);
        putResult = null;
        mapping = function(next, key, index, keys) {
          putResult = function(error, result) {
            if (!error) {
              modified[key] = result;
            }
            next(error);
          };
          iterator(putResult, hash[key], key, hash);
        };
        after = function(error) {
          callback(error, modified);
        };
        return eachProc(mapping, after, __.keys(hash));
      };
    };
    mixin = contexts._iteratorMixin;
    fill = contexts._arrayEachFill;
    order = contexts._arrayEachOrder;
    return {
      map: mixin('pp#map', arrayMapBy(fill), hashMapBy(fill)),
      mapOrder: mixin('pp#mapOrder', arrayMapBy(order), hashMapBy(order))
    };
  })());

  contexts.extend((function() {
    var foldBy, foldLeft, foldOne, foldRight, reverseIndex, validateFoldOne;
    validateFoldOne = function(name, target) {
      var message;
      if (!__.isArray(target)) {
        message = "require Array (Not Null) to folding, but " + (typeof target);
      } else if (!target.length) {
        message = 'Array length is 0, and without init value';
      } else {
        return;
      }
      return __.error.invalidArgument(name, target, message);
    };
    foldBy = function(setIndex) {
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
    };
    foldOne = function(name, method, fold) {
      var folding;
      return folding = function(iterator, receiver, array) {
        var copied, error, init;
        error = validateFoldOne(name, array);
        if (error) {
          return receiver(error);
        }
        copied = array.slice();
        init = copied[method]();
        return fold(iterator, receiver, init, copied);
      };
    };
    reverseIndex = function(index, limit) {
      return limit - (index + 1);
    };
    foldLeft = foldBy(__.id);
    foldRight = foldBy(reverseIndex);
    return {
      foldl: foldLeft,
      foldr: foldRight,
      foldl1: foldOne('pp#foldl1', 'shift', foldLeft),
      foldr1: foldOne('pp#foldr1', 'pop', foldRight)
    };
  })());

  contexts.extend((function() {
    var filterBy;
    filterBy = function(tester) {
      var cpsFilter;
      return cpsFilter = function(iterator, callback, array) {
        var after, filter, pushMatched, stackMatched;
        stackMatched = [];
        pushMatched = null;
        filter = function(next, value, index) {
          pushMatched = function(error, result) {
            if (tester(result)) {
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
    return {
      filter: filterBy(__.id),
      reject: filterBy(__.not)
    };
  })());

  contexts.extend((function() {
    var isHaltLoop, isReachEnd, judgeByLength, logical;
    logical = function(test, wrap) {
      var predicate;
      return predicate = function(iterator, receiver, iterable) {
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
        return contexts.each(checkIterate, wrap(receiver), iterable);
      };
    };
    judgeByLength = function(judge) {
      var wrapper;
      return wrapper = function(receiver) {
        var callback;
        return callback = function(error) {
          receiver(error, judge(arguments.length));
        };
      };
    };
    isHaltLoop = function(n) {
      return n > 1;
    };
    isReachEnd = function(n) {
      return n < 2;
    };
    return {
      any: logical(__.id, judgeByLength(isHaltLoop)),
      all: logical(__.not, judgeByLength(isReachEnd)),
      find: logical(__.id, __.id)
    };
  })());

  contexts.extend((function() {
    var untilBy;
    untilBy = function(check) {
      var cpsLoop;
      return cpsLoop = function(test, iterator, callback, init) {
        var afterTest, finished, main, mainArgs, memo, next;
        memo = __.isArray(init) ? init.slice() : [];
        finished = false;
        next = function() {
          var args, error;
          error = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          if (finished) {
            return;
          }
          if (error) {
            finished = true;
            callback(error);
          } else {
            if (args.length) {
              memo = args;
            }
          }
        };
        afterTest = function(error, result) {
          if (error || check(result)) {
            finished = true;
            memo.unshift(error || null);
            callback.apply(null, memo);
          } else {
            memo.unshift(next);
            iterator.apply(null, memo);
          }
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
    return {
      whilist: untilBy(__.not),
      until: untilBy(__.id)
    };
  })());

  contexts.extend((function() {
    var doTaskBy;
    doTaskBy = function(apiName, mapProc) {
      var runTask;
      return runTask = function(tasks, callback) {
        var iterator;
        iterator = function(next, fn) {
          var message;
          if (typeof fn !== 'function') {
            message = "required function. but include " + (typeof fn);
            next(__.error.invalidArgument(apiName, fn, message));
            return;
          }
          fn(function() {
            var args;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            next.apply(null, args);
          });
        };
        return mapProc(iterator, callback, tasks);
      };
    };
    return {
      fill: doTaskBy('pp#fill', contexts.map),
      order: doTaskBy('pp#order', contexts.mapOrder)
    };
  })());

  pp.iterator = function(procs) {
    var iteratorCache, limit, procByIndex;
    limit = procs.length;
    if (!limit) {
      return;
    }
    iteratorCache = [];
    procByIndex = function(index) {
      var fn;
      if (index < iteratorCache.length) {
        return iteratorCache[index];
      }
      fn = function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        procs[index].apply(procs[index], args);
        return fn.next();
      };
      fn.next = function() {
        if (index < limit - 1) {
          return procByIndex(index + 1);
        } else {
          return null;
        }
      };
      fn.clearCache = function() {
        iteratorCache = [];
      };
      iteratorCache[index] = fn;
      return fn;
    };
    return procByIndex(0);
  };

  pp.waterfall = function(procs, callback) {
    var finished, wrap;
    if (callback == null) {
      callback = __.id;
    }
    if (!procs.length) {
      return callback();
    }
    finished = false;
    wrap = function(iterator) {
      var whenEnd, wrapped;
      whenEnd = function() {
        var results;
        results = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        callback.apply(null, results);
        iterator.clearCache();
      };
      return wrapped = function() {
        var args, error, next;
        error = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        if (finished) {
          return;
        }
        if (error) {
          finished = true;
          callback(error);
          return;
        }
        next = iterator.next();
        args.unshift(next ? wrap(next) : whenEnd);
        __.defer(function() {
          iterator.apply(iterator, args);
        });
      };
    };
    __.defer(wrap(pp.iterator(procs)));
  };

}).call(this);
