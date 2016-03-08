(function() {
  'use strict';

  var println = function(msg) {
    process.stdout.write(msg + '\n');
  };

  var printerr = function(msg) {
    process.stderr.write(msg.error + '\n');
  };

  var printwarn = function(msg) {
    process.stderr.write(msg.warn + '\n');
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
    } else {
      process.stdout.write('.');
    }
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
    displayProgress: displayProgress,
    displayObjectKeys: displayObjectKeys,
    displayHelp: displayHelp
  };
})();
