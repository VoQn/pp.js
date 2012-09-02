;(function(root) {
  var pp = {};

  if (typeof require === 'function') {
    pp = require('../lib/pp');
  }

  var ARGV = process && process.argv || [];

  var _test_array_length = ARGV.length > 2 ? ARGV[2] : 1.0e+5;

  var bigArray = (function(l) {
    var array = [], i;
    for (i = 0; i < l; i++) {
      array[i] = i + 1;
    }
    return array;
  })(_test_array_length);

  var _pretty_print = function(any) {
    if (Array.isArray(any)) {
      return any.length > 6 ?
          '[' + any.slice(0, 5) + ', ... ,' + any[any.length - 1] +
             '] (length : ' + any.length + ')' :
          '[' + any + ']';
    }
    return any;
  }

  var _time_expr = function(from, opt_to) {
    var to = opt_to || Date.now(),
        dt = to - from;
    if (dt > 6.0e+4) {
      return ~~(dt / 6.0e+4) + 'm' +
        ((dt % 6.0e+4) / 1.0e+3) + 's';
    }
    if (dt > 1.0e+3) {
      return (dt / 1.0e+3) + 's';
    }
    return dt + 'ms';
  }

  var _start_time, _time_stamp;

  var _time_stamp_log = function(label, opt_color) {
    var now = Date.now(), color;
    if (now - _time_stamp < pp.TIME_SLICE.FPS_1) {
      return;
    }
    color = opt_color || '\x1b[34m';
    pp.defer(console.log,
      color + label + ' -- ' +
      _time_expr(_start_time, now) + '\x1b[0m'
    );
    _time_stamp = now;
  };

  var doTask_running_label = function(runner_name, type,  index, delay) {
    return runner_name + ' - ' + type + ' [' + index + ']' +
      (type === 'register' ? '(after ' + delay + 'ms)' : '') +
      ' -- ' + _time_expr(_start_time);
  };

  var _random_delay = function(delay_width) {
    return Math.floor(Math.random() * delay_width + 1);
  };

  var taskList = function(runner_name) {
    var makeCallback = function(name, index, time_out) {
      return function(next) {
        var delay = _random_delay(time_out);
        console.log(
            '\x1b[35m' +
            doTask_running_label(runner_name, 'register', index, delay) +
            '\x1b[0m'
            );
        setTimeout(function() {
          console.log(
            '\x1b[34m' +
            doTask_running_label(runner_name, 'invoke', index, delay) +
            '\x1b[0m'
            );
          next(null, name);
        }, delay);
      };
    }
    return [makeCallback('1st', 0, 1000),
            makeCallback('2nd', 1, 1000),
            makeCallback('3rd', 2, 1000),
            makeCallback('4th', 3, 1000),
            makeCallback('5th', 4, 1000)];
  };

  var doTask = function(runner, runner_name) {
    runner(taskList(runner_name),
        function(error, result) {
          console.log(
            '\x1b[35m\x1b[1m' +
            runner_name + ' - done -- ' +
            _time_expr(_start_time) +
            '\n  result >>> ', result, '\x1b[0m'
            );
        });
  };

  var taskRunnerTest = function() {
    doTask(pp.order, 'pp#order');
    doTask(pp.fill, 'pp#fill ');
  };

  var _iterator_tests = {
    '#1 pp#each  ': {
      type: 'iteration',
      func: pp.each,
      iter: function(next, value) {
        next();
      }
    },
    '#2 pp#map   ': {
      type: 'iteration',
      func: pp.map,
      iter: function(next, value) {
        next(null, value * value);
      }
    },
    '#3 pp#filter': {
      type: 'iteration',
      func: pp.filter,
      iter: function(next, value) {
        next(null, value > 0 && value % 3 < 1);
      }
    },
    '#4 pp#reject': {
      type: 'iteration',
      func: pp.reject,
      iter: function(next, value) {
        next(null, value < 1 || value % 7 > 0);
      }
    },
    /*
    '#5 pp#foldl1': {
      type: 'folding',
      func: pp.foldl1,
      iter: function(next, memo, value) {
        next(null, memo + 1 / value);
      }
    },
    '#6 pp#foldr1': {
      type: 'folding',
      func: pp.foldr1,
      iter: function(next, memo, value) {
        next(null, memo + 1 / value);
      }
    },
    */
    '#5 pp#find  ': {
      type: 'iteration',
      func: pp.find,
      iter: function(next, value, index, iterable) {
        next(null, index + 1 > iterable.length / 2);
      }
    },
    '#6 pp#any   ': {
      type: 'iteration',
      func: pp.any,
      iter: function(next, value) {
        next(null, value % 2 < 1);
      }
    },
    '#7 pp#all   ': {
      type: 'iteration',
      func: pp.all,
      iter: function(next, value) {
        next(null, value > -1);
      }
    }
  };

  var whilist_test = function(n) {
    pp.whilist(
      function(i) {
        return i > 0;
      }, function(next, i, a, b) {
        _time_stamp_log('pp#whilist -- running [' + (n - i) + ']');
        next(null, i - 1, b, a + b);
      }, function(error, _, __, b) {
        console.log('\x1b[35m\x1b[1mpp#whilist - done --',
          _time_expr(_start_time),
          '\n  result >>>',
          b, '\x1b[0m');
      }
    , [n, 1, 0]);
  };

  var runnner_by_type = function(type, name, runner) {
    return {
      iteration: function(next, value, index, iterable) {
        _time_stamp_log(name + ' - running : [' + index + ']', '\x1b[34m');
        runner(next, value, index, iterable);
      },
      folding: function(next, memo, value, index, iterable) {
        _time_stamp_log(name + ' - running : [' + index + ']', '\x1b[34m');
        runner(next, memo, value, index, iterable);
      }
    }[type];
  };

  var _modified = function(obj, iter) {
    var hash, number_from_label, keys, i, l, key;

    hash = {};

    number_from_label = function(x) {
      return ~~(x.match(/^#([0-9]+)/i)[1]);
    };

    keys = Object.keys(obj).sort(function(a, b) {
      return number_from_label(a) - number_from_label(b);
    });

    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i];
      hash[key] = iter(obj[key], key);
    }

    return hash;
  };
  _start_time = Date.now();
  _time_stamp = _start_time;

  pp.map(function(after, runner, runner_name) {
    var callback, runner_start_at, time;

    callback = function(error, result) {
      time = _time_expr(runner_start_at);
      pp.defer(console.log,
        '\x1b[33m' + runner_name + ' - done -- ' +
        _time_expr(_start_time) + ' (' + time + ')' +
        '\n  result >>> ' + _pretty_print(result) + '\x1b[0m'
      );
      after(error, { result: result, time: time });
    };

    runner_start_at = Date.now();

    pp.defer(console.log,
        '\x1b[36m' + runner_name + ' - start -- ' +
        _time_expr(_start_time) + '\x1b[0m'
    );

    runner.func(
      runnner_by_type(runner.type, runner_name, runner.iter),
      callback,
      bigArray,
      pp.TIME_SLICE.FPS_1);

  }, function(error, result) {
    var msg = [
      '\x1b[1m' + 'All iteration test done -- ' +
      _time_expr(_start_time) + '\x1b[0m',
      '\x1b[32m' + 'result:'
    ];

    _modified(result, function(v, k) {
      msg.push('  ' + k + ' : ' +
        _pretty_print(v.result) + ' -- ' + v.time
      );
    });

    msg.push('-----------------------------------------------\x1b[0m');

    pp.defer(console.log, msg.join('\n'));

    //whilist_test(Math.floor(Math.sqrt(_test_array_length)));
    //taskRunnerTest();
 }, _iterator_tests);
})(this);
