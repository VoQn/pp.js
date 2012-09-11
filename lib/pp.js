(function() {
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
      isInternal = name.match(/^_/i);
      internal[isInternal ? name.substring(1) : name] = proc;
      if (!isInternal) {
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
          return any.slice();
        }
        if (toString.call(any) === '[object Object]') {
          return {};
        }
        Inherit = function() {};
        Inherit.prototype = any.prototype;
        return new Inherit();
      },
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
      }
    };
  });

  pp.extend(function(util) {
    var TIME_SLICE, getUnixTime, invoke, limitTimeSlice, procStack, timeStack;
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
    getUnixTime = Date.now || function() {
      return +new Date();
    };
    invoke = function() {
      var current, timeLimit, timeSlice;
      if (!procStack.length) {
        return;
      }
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
            procStack.push(function() {
              return fn.apply(null, args.slice(0, requireLength));
            });
            timeStack.push(limitTimeSlice(requireLength < args.length ? args[requireLength] : 0));
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
      }
    };
  });

  pp.extend(function(util) {
    return {
      _trampolines: function(procedures) {
        var name, proc, trampolines;
        trampolines = {};
        for (name in procedures) {
          if (!__hasProp.call(procedures, name)) continue;
          proc = procedures[name];
          if (!name.match(/^_/i)) {
            trampolines["_" + name] = proc;
            trampolines[name] = util.trampoline(proc);
          } else {
            trampolines[name] = proc;
          }
        }
        return trampolines;
      },
      _iteratorMixin: function(mixinName, arrayIterator, hashIterator) {
        var mixin;
        return mixin = function(iterator, receiver, iterable) {
          var message;
          if (util.isPrimitive(iterable)) {
            message = 'required Array or Object as HashMap';
            receiver(util.invalidArgumentError(mixinName, iterable, message));
            return;
          }
          if (util.isArray(iterable)) {
            return arrayIterator(iterator, receiver, iterable);
          } else {
            return hashIterator(iterator, receiver, iterable);
          }
        };
      }
    };
  });

  pp.extend(function(util) {
    var Promise, REJECTED, RESOLVED, UNRESOULVED, fire;
    UNRESOULVED = 'unresolved';
    RESOLVED = 'resolved';
    REJECTED = 'rejected';
    fire = pp.trampoline(function(promise, value) {
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
    Promise = (function() {

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
    return {
      promise: function(scope) {
        return new Promise(scope);
      }
    };
  });

  pp.extend(function(util) {
    var Generator;
    Generator = (function() {

      function Generator(continuation) {
        this.continuation = continuation;
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

      return Generator;

    })();
    return {
      generator: function(fn) {
        return new Generator(fn);
      }
    };
  });

  pp.extend(function(util) {
    var forEach, forEachStepBy, toLimit, waitCallback;
    forEachStepBy = function(name, step) {
      var arrayForEach, hashForEach,
        _this = this;
      arrayForEach = function(iterator, callback, array) {
        var count, finished, index, limit, main, next;
        limit = array.length;
        if (!limit) {
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
          if (step(index, limit, count)) {
            iterator(next, array[index], index, array);
            ++index;
          }
          return main;
        };
      };
      hashForEach = function(iterator, callback, hash) {
        var hashIterator;
        hashIterator = function(next, key, index, keys) {
          iterator(next, hash[key], key, hash);
        };
        return arrayForEach(hashIterator, callback, util.keys(hash));
      };
      return {
        array: arrayForEach,
        hash: hashForEach,
        mixin: util.iteratorMixin(name, arrayForEach, hashForEach)
      };
    };
    toLimit = function(index, limit) {
      return index < limit;
    };
    waitCallback = function(index, limit, count) {
      return index < limit && index <= count;
    };
    forEach = {
      fill: forEachStepBy('pp#each', toLimit),
      order: forEachStepBy('pp#eachOrder', waitCallback)
    };
    return util.trampolines({
      _arrayEachFill: forEach.fill.array,
      _arrayEachOrder: forEach.order.array,
      each: forEach.fill.mixin,
      eachOrder: forEach.order.mixin
    });
  });

  pp.extend(function(util) {
    var arrayMapBy, fill, hashMapBy, mixin, order;
    arrayMapBy = function(forEach) {
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
        return forEach(mapping, after, array);
      };
    };
    hashMapBy = function(forEach) {
      var cpsMap;
      return cpsMap = function(iterator, callback, hash) {
        var after, mapping, modified, putResult;
        modified = util.inherit(hash);
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
        return forEach(mapping, after, util.keys(hash));
      };
    };
    mixin = util.iteratorMixin;
    fill = util.arrayEachFill;
    order = util.arrayEachOrder;
    return util.trampolines({
      map: mixin('pp#map', arrayMapBy(fill), hashMapBy(fill)),
      mapOrder: mixin('pp#mapOrder', arrayMapBy(order), hashMapBy(order))
    });
  });

  pp.extend(function(util) {
    var direction, fold, foldingFrom, validateFoldOne;
    direction = {
      left: {
        name: 'pp#foldl',
        indexChoose: util.id,
        arrayMethod: 'shift'
      },
      right: {
        name: 'pp#foldr',
        indexChoose: function(index, limit) {
          return limit - (index + 1);
        },
        arrayMethod: 'pop'
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
      var fold1Name, foldArray;
      foldArray = function(iterator, callback, init, array) {
        var accumulate, after, folding, memo;
        memo = init;
        accumulate = null;
        folding = function(next, value, index, iterable) {
          index = direction.indexChoose(index, iterable.length);
          accumulate = function(error, result) {
            memo = result;
            next(error);
          };
          iterator(accumulate, memo, iterable[index], index, iterable);
        };
        after = function(error) {
          callback(error, memo);
        };
        return util.arrayEachOrder(folding, after, array);
      };
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
          init = copied[direction.arrayMethod]();
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
    var filterBy;
    filterBy = function(name, tester) {
      var arrayFilter, hashFilter;
      arrayFilter = function(iterator, callback, array) {
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
        return util.arrayEachOrder(filter, after, array);
      };
      hashFilter = function(iterator, callback, hash) {
        var after, filter, modified, putMatched;
        modified = util.inherit(hash);
        putMatched = null;
        filter = function(next, key, index, keys) {
          putMatched = function(error, result) {
            if (tester(result)) {
              modified[key] = hash[key];
            }
            next(error);
          };
          iterator(putMatched, hash[key], key, hash);
        };
        after = function(error) {
          callback(error, modified);
        };
        return util.arrayEachFill(filter, after, util.keys(hash));
      };
      return util.iteratorMixin(name, arrayFilter, hashFilter);
    };
    return util.trampolines({
      filter: filterBy('pp#filter', util.id),
      reject: filterBy('pp#reject', util.not)
    });
  });

  pp.extend(function(util) {
    var isHaltLoop, isReachEnd, judgeByLength, logical;
    logical = function(name, test, wrap) {
      var arrayCheck, hashCheck;
      arrayCheck = function(iterator, receiver, array) {
        var afterCheck, checkIterate;
        afterCheck = null;
        checkIterate = function(next, value, index, iterable) {
          afterCheck = function(error, result) {
            if (test(result)) {
              next(error, value, index);
              return;
            }
            next(error);
          };
          iterator(afterCheck, value, index, iterable);
        };
        return util.arrayEachFill(checkIterate, wrap(receiver), array);
      };
      hashCheck = function(iterator, receiver, hash) {
        var afterCheck, checkIterate;
        afterCheck = null;
        checkIterate = function(next, key, index, keys) {
          afterCheck = function(error, result) {
            if (test(result)) {
              next(error, hash[key], key);
              return;
            }
            next(error);
          };
          iterator(afterCheck, hash[key], key, hash);
        };
        return util.arrayEachFill(checkIterate, wrap(receiver), util.keys(hash));
      };
      return util.iteratorMixin(name, arrayCheck, hashCheck);
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
    return util.trampolines({
      any: logical('pp#any', util.id, judgeByLength(isHaltLoop)),
      all: logical('pp#all', util.not, judgeByLength(isReachEnd)),
      find: logical('pp#find', util.id, util.id)
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
        next = function() {
          var args, error;
          error = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          if (finished) {
            return;
          }
          if (error) {
            finished = true;
            callback(error);
            return;
          }
          if (args.length) {
            memo = args;
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
      waterfall: function(procs, callback) {
        var finished, wrap;
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
            var args, error;
            error = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
            if (finished) {
              return;
            }
            if (error) {
              finished = true;
              callback(error);
              return;
            }
            pp.defer(function() {
              var next;
              next = iterator.next();
              args.unshift(next ? wrap(next) : whenEnd);
              iterator.apply(iterator, args);
            });
          };
        };
        pp.defer(wrap(pp.iterator(procs)));
      }
    };
  });

}).call(this);
