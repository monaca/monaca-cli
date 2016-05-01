(function() {
'use strict';

var argv = require('optimist').argv,
  colors = require('colors'),
  fs = require('fs'),
  path = require('path'),
  util = require(path.join(__dirname, 'util'));

colors.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'grey',
  info: 'green',
  data: 'grey',
  help: 'cyan',
  warn: ['yellow', 'bold'],
  debug: 'blue',
  error: ['red', 'bold'],
  success: ['green', 'bold']
});

var taskList = {};

var docsPath = '../doc/tasks/';
fs.readdirSync(path.join(__dirname, docsPath)).forEach(function(filename) {
  taskList[filename.split('.')[0]] = JSON.parse(fs.readFileSync(path.join(__dirname, docsPath, filename), 'utf-8'));
});

var VERSION = require(path.join(__dirname, '..', 'package.json')).version;

var Monaca = {
  _getTask: function() {
    var task = {};
    task.name = '';

    for (var i = 0; i < argv._.length; i++) {
      var v = argv._[i];
      task.name = [task.name, v].join(' ').trim();

      for (var taskSet in taskList) {
        if (taskList.hasOwnProperty(taskSet)) {
          for (var taskName in taskList[taskSet]) {
            if (taskName === task.name && taskList[taskSet].hasOwnProperty(taskName)) {
              task.set = taskSet;
              return task;
            }
          }
        }
      }
    }

    return task;
  },
  run: function() {

    // Version.
    if (argv._[0] === 'version' || argv.version || argv.v) {
      this.printVersion();
      process.exit(0);
    }

    // Help.
    if (!argv._[0] || argv._[0] === 'help') {
      this.printHelp(argv.all);
      process.exit(0);
    }

    var task = this._getTask();

    if (!task.set) {
      util.fail('Error: ' + task.name + ' is not a valid task.');
    }

    if (argv.help || argv.h
      || (task.name === 'create' && argv._.length < 2)
      || (task.name === 'remote build' && !argv.browser && argv._.length < 3)) {
      util.displayHelp(task.name, taskList[task.set]);
      process.exit(0);
    }

    var runner = function(task) {
      var result = (require(path.join(__dirname, task.set))).run(task.name);
      Promise.resolve(result).then(function(result) {
        if (result && result.nextTask) {
          runner(result.nextTask);
        }
      })
    };    
    runner(task);
  },
  printVersion: function() {
    util.print(VERSION.info.bold);
  },
  printLogo: function() {
    var logoFile = path.join(__dirname, '..', 'doc', 'logo.txt'),
      logo = fs.readFileSync(logoFile).toString();

    util.print(logo.bold.blue);
    util.print(' Command Line Interface for Monaca and Onsen UI');
    util.print(' Monaca CLI Version ' + VERSION + '\n');
  },
  printUsage: function() {
    util.print('Usage: monaca command [args]\n');
  },
  printCommands: function(showAll) {
    util.print('Commands: (use --all to show all)\n');

    showAll = showAll || false;

    var tasks = Object.keys(taskList)
      .map(function(taskSet) {
        return Object.keys(taskList[taskSet]).map(function(taskName) {
          var task = taskList[taskSet][taskName];
          if (task.showInHelp !== false || showAll === true) {
            return [taskName, task];
          } else {
            return ['', ''];
          }
        });
      })
      .reduce(function(a, b) {
        return a.concat(b);
      })
      .filter(function(a) {
        return a.join('') !== '';
      });

    tasks
      .sort(function(a, b) {
        var a_key = a[0];
        if (a[1].order < b[1].order) return -1;         
        if (a[1].order > b[1].order) return 1;
        return 0;
      })
    .forEach(function(task) {
      var cmd = task[0],
        desc = task[1].description,
        dots = new Array(15 - cmd.length).join('.');
      util.print('  ' + cmd.bold.info + '  ' + dots.grey + '  ' + desc.bold);
    });

    util.print('');
  },
  printDescription: function() {
    util.print('  To learn about a specific command type:\n');
    util.print('  $ monaca <command> --help\n');
  },
  printExamples: function() {
    util.print('Typical Usage:\n');

    util.print('  $ monaca create myproject # Create a new project from various templates');
    util.print('  $ cd myproject');
    util.print('  $ monaca preview # Preview app on a browser');
    util.print('  $ monaca debug # Run the app in Monaca Debugger');
    util.print('  $ monaca remote build # Execute remote build for packaging');
  },
  printHelp: function(showAll) {
    this.printLogo();
    this.printUsage();
    this.printDescription();
    this.printCommands(showAll);
    this.printExamples();

    util.print('');
  }
};

exports.Monaca = Monaca;
})();
