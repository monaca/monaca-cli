var path = require('path');

var util = require(path.join(__dirname, 'util'));

var BaseTask = function(){};

BaseTask.prototype = {
    run: function(taskName){},
    taskList: [],
    isMyTask: function(taskName){
        var taskNames = Object.keys(this.taskList);

        for (var i = 0, l = taskNames.length; i < l; i++) {
            var task = taskNames[i];

            if (task === taskName) return true;
        }

        return false;
    }
};

BaseTask.prototype.displayHelp = function(taskName) {
  var task = this.taskList[taskName],
    i, desc;

  util.print('');
  
  if (!task) {
    util.err('No such task.');
    process.exit(1);
  }

  util.print('Usage: ' + task.usage + '\n');

  if (task.longDescription) {
    var lines = [];

    desc = task.longDescription;
    util.print('Description:\n');

    if (desc instanceof Array) {
      lines = desc;
    }
    else {
      lines = task.longDescription.split('\n');
    }

    for (i = 0, l = lines.length; i < l; i ++) {
      var line = lines[i];

      util.print('  ' + line);
    }
    
    util.print('');
  }

  if (task.options) {
    util.print('Options:\n');
    for (i = 0; i < task.options.length; i++) {
      var option = task.options[i],
        param = option[0],
        blank = Array(30 - param.length).join(' ');
      desc = option[1];

      util.print('  ' + param + blank + desc);
    }

    util.print('');
  }

  if (task.examples) {
    util.print('Examples:\n');

    for (i = 0; i < task.examples.length; i++) {
      var example = task.examples[i];

      util.print('  $ ' + example);
    }
  }

  util.print('');

  process.exit(0);
};

exports.BaseTask = BaseTask;
