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
  error: ['red', 'bold']
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
      this.printHelp();
      process.exit(0);
    }

    var task = this._getTask();

    if (!task.set) {
      util.fail('Error: ' + task.name + ' is not a valid task.');
    }

    if (argv.help || argv.h || (task.name === 'create' && argv._.length < 2)) {
      util.displayHelp(task.name, taskList[task.set]);
      process.exit(0);
    } else {
      (require(path.join(__dirname, task.set))).run(task.name);
    }
  },
  printVersion: function() {
    util.print(VERSION.info.bold);
  },
  printLogo: function() {
    var logoFile = path.join(__dirname, '..', 'doc', 'logo.txt'),
      logo = fs.readFileSync(logoFile).toString();

    util.print(logo.bold.blue);
    util.print(' Version ' + VERSION + '\n');
  },
  printUsage: function() {
    util.print('Usage: monaca command [args]\n');
  },
  printCommands: function() {
    util.print('Commands:\n');

    var tasks = Object.keys(taskList).map(function(taskSet) {
        return Object.keys(taskList[taskSet]).map(function(taskName) {
          var task = taskList[taskSet][taskName];
          if (task.showInHelp !== false) {
            return [taskName, task.description];
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

    tasks.forEach(function(task) {
      var cmd = task[0],
        desc = task[1],
        dots = new Array(15 - cmd.length).join('.');
      util.print('  ' + cmd.bold.info + '  ' + dots.grey + '  ' + desc.bold);
    });

    util.print('');
  },
  printDescription: function() {
    util.print('Description:\n');

    util.print('  Monaca command-line interface.\n');

    util.print('  To learn about a specific command type:\n');
    util.print('  $ monaca <command> --help\n');
  },
  printExamples: function() {
    util.print('Examples:\n');

    util.print('  $ monaca create myproject');
    util.print('  $ cd myproject');
    util.print('  $ monaca build');
    util.print('  $ monaca run android');
  },
  printHelp: function() {
    this.printLogo();
    this.printUsage();
    this.printDescription();
    this.printCommands();
    this.printExamples();

    util.print('');
  }
};

exports.Monaca = Monaca;
})();
