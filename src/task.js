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
  util.print('');

  var task = this.taskList[taskName];

  if (!task) {
    util.err('No such task.');
    process.exit(1);
  }

  util.print('Usage: ' + task.usage + '\n');

  if (task.longDescription) {
    var desc = task.longDescription,
      lines = [];

    util.print('Description:\n');

    if (desc instanceof Array) {
      lines = desc;
    }
    else {
      lines = task.longDescription.split('\n');
    }

    for (var i = 0, l = lines.length; i < l; i ++) {
      var line = lines[i];

      util.print('  ' + line);
    }
    
    util.print('');
  }

  if (task.options) {
    util.print('Options:\n');

    for (var i = 0, l = task.options.length; i < l; i ++) {
      var option = task.options[i],
        param = option[0],
        desc = option[1];
      
      var blank = Array(30 - param.length).join(' ');

      util.print('  ' + param + blank + desc);
    }

    util.print('');
  }

  if (task.examples) {
    util.print('Examples:\n');

    for (var i = 0, l = task.examples.length; i < l; i ++) {
      var example = task.examples[i];

      util.print('  $ ' + example);
    }
  }

  util.print('');

  process.exit(0);
};

exports.BaseTask = BaseTask;
