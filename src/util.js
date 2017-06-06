(function() {
'use strict';

var Q = require('q'),
  fs = require('fs'),
  path = require('path');

var _print = function(type, items) {
  var msg = '';
  for (var i = 0; i < items.length; i++) {
    msg += parseItem(items[i]);
  }

  process[type === 'error' ? 'stderr' : 'stdout'].write((type ? msg[type] : msg) + '\n');
};

var println = function() {
  _print('', arguments);
};

var printerr = function() {
  _print('error', arguments);
};

var printwarn = function() {
  _print('warn', arguments);
};

var printsuccess = function() {
  _print('success', arguments);
};

var fail = function() {
  _print('error', arguments);
  process.exit(1);
};

var parseItem = function(item) {
  item = item || '';
  switch (typeof item) {
    case 'object':
      return item.message || '';
    default:
      return item;
  }
};

var displayObjectKeys = function(object) {
  println(
    Object.keys(object).map(function(file, index) {
      return (index + 1) + '. ' + file;
    })
    .join('\n')
  );
};

var displayProgress = function(progress) {
  if (typeof progress === 'object' && progress !== null) {
    var per = 100 * (progress.index + 1) / progress.total;
    per = per.toString().substr(0, 5) + '%';
    println(('[' + per + '] ').verbose + progress.path);
  } else if (typeof progress === 'string') {
    process.stdout.write('.');
  }
};

var displayLoginErrors = function(error) {

  var deferred = Q.defer();

  if (error === 'ECONNRESET') {
    printerr('Unable to connect to Monaca Cloud.');
    println('Are you connected to the Internet?');
    println('If you need to use a proxy, please configure it with "monaca proxy".');
  } else {
    printerr('Must be signed in to Monaca when using this command.');
    println();
    println('Monaca account is free for the basic usage.');
    println('For more details, visit https://monaca.io/pricing.html')
    println();
    println('Starting Sign Up - use "monaca login" if you already have an account.')
    println();

    deferred.resolve({
      nextTask: {
        set: 'auth',
        name: 'signup'
      }
    });

  }

  return deferred.promise;
};

var displayHelp = function(taskName, taskList) {
  var task = taskList[taskName],
    i, desc;

  println('');

  if (!task) {
    printerr('No such task.');
    process.exit(1);
  }

  println('Usage: '.info + task.usage + '\n');

  if (task.aliases) {
    println('Aliases: '.info + taskName + ' | ' + task.aliases.join(' | ') + '\n');
  }

  if (task.longDescription) {
    var lines = [];

    desc = task.longDescription;
    println('Description:\n'.info);

    if (desc instanceof Array) {
      lines = desc;
    } else {
      lines = task.longDescription.split('\n');
    }

    for (i = 0; i < lines.length; i++) {
      var line = lines[i];

      println('  ' + line);
    }

    println('');
  }

  if (task.options) {
    println('Options:\n'.info);
    for (i = 0; i < task.options.length; i++) {
      var option = task.options[i],
        param = option[0],
        blank = new Array(30 - param.length).join(' ');

      desc = option[1];
      println('  ' + param + blank + desc);
    }

    println('');
  }

  if (task.examples) {
    println('Examples:\n'.info);

    for (i = 0; i < task.examples.length; i++) {
      var example = task.examples[i];

      println('  $ ' + example);
    }
  }

  println('');
};

var checkNodeRequirement = function() {
  if (Number(process.version.match(/^v(\d+\.\d+)/)[1]) < 6) {
    printwarn('\nWarning: your current Node version may not be compatible with the transpiling feature.');
    printwarn('Please consider updating your Node to version 6 or higher.\n');
  }
}
var hasMonacaCLIUpdateFile = function(dir) {
  var deferred = Q.defer();

  var settingsFile = path.join(dir, 'monaca_cli_update.json');

  fs.exists(settingsFile, function(exists) {
    if (exists) {
      deferred.resolve(settingsFile);
    } else {
      deferred.reject(settingsFile);
    }
  });

  return deferred.promise;
};

var getCLIUpdate = function(dir, key) {
  var deferred = Q.defer();

  hasMonacaCLIUpdateFile(dir)
    .then(function(settingsFile) {
      fs.readFile(settingsFile, function(error, data) {
        if (error) {
          deferred.reject(error);
        } else {
          try {
            var settings = JSON.parse(data.toString());
            deferred.resolve(settings[key]);
          }
          catch (e) {
            deferred.reject(e);
          }
        }
      });
    },
      function(updateFile) {
        var obj = {};

        fs.writeFile(updateFile, JSON.stringify(obj), function(error) {
          if (error) {
            deferred.reject(error);
          } else {
            deferred.resolve();
          }
        });
      }
    );

  return deferred.promise;
};

var setCLIUpdate = function(dir, key, value) {
  var deferred = Q.defer();

  hasMonacaCLIUpdateFile(dir)
  .then(function(updateFile) {
    fs.readFile(updateFile, function(error, data) {
      try {
        var obj = JSON.parse(data.toString());

        obj[key] = value;

        fs.writeFile(updateFile, JSON.stringify(obj, null, 2), function(error) {
          if (error) {
            deferred.reject(error);
          } else {
            deferred.resolve();
          }
        });
      } catch (e) {
        deferred.reject(e);
      }
    });
    },
    function(updateFile) {
      var obj = {};
      obj[key] = value;

      fs.writeFile(updateFile, JSON.stringify(obj), function(error) {
        if (error) {
          deferred.reject(error);
        } else {
          deferred.resolve();
        }
      });
    });
  return deferred.promise;
};

module.exports = {
  print: println,
  err: printerr,
  warn: printwarn,
  success: printsuccess,
  fail: fail,
  parseError: parseItem,
  displayProgress: displayProgress,
  displayObjectKeys: displayObjectKeys,
  displayLoginErrors: displayLoginErrors,
  displayHelp: displayHelp,
  checkNodeRequirement: checkNodeRequirement,
  setCLIUpdate: setCLIUpdate,
  getCLIUpdate: getCLIUpdate
};
})();
