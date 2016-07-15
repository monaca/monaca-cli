(function() {
'use strict';

var Q = require('q');

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

  println('Usage: ' + task.usage + '\n');

  if (task.longDescription) {
    var lines = [];

    desc = task.longDescription;
    println('Description:\n');

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
    println('Options:\n');
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
    println('Examples:\n');

    for (i = 0; i < task.examples.length; i++) {
      var example = task.examples[i];

      println('  $ ' + example);
    }
  }

  println('');
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
  displayHelp: displayHelp
};
})();
