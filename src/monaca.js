(function() {
'use strict';

var argv = require('optimist').argv,
  colors = require('colors'),
  fs = require('fs'),
  path = require('path'),
  https = require('https'),
  lib = require(path.join(__dirname, 'lib')),
  util = require(path.join(__dirname, 'util')),
  terminal = require(path.join(__dirname, 'terminal'));

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
var latestVersion;

https.get('https://ide.monaca.mobi/api/public/versions', function(res) {
  res.on('data', function (data) {
     data = JSON.parse(data);
     latestVersion = data.result.monacaCli.replace(/"/g,'').split('/').pop();
   });
});

var docsPath = '../doc/tasks/';
fs.readdirSync(path.join(__dirname, docsPath)).forEach(function(filename) {
  taskList[filename.split('.')[0]] = JSON.parse(fs.readFileSync(path.join(__dirname, docsPath, filename), 'utf-8'));
});

var VERSION = require(path.join(__dirname, '..', 'package.json')).version;
var info = {
  clientType: 'cli',
  clientVersion: VERSION
};

var USER_CORDOVA = path.join(
  process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'],
  '.cordova'
);
var CONFIG_FILE = path.join(USER_CORDOVA, 'monaca_config.json');

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
            if (taskList[taskSet].hasOwnProperty(taskName) && (taskName === task.name
                || ((taskList[taskSet][taskName].aliases || []).indexOf(task.name) !== -1))
              ) {

              task.set = taskSet;
              task.name = taskName;
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
      lib.printVersion();
      process.exit(0);
    }

    // Help.
    var extended = false;
    if (!argv._[0] && argv.help) {
      extended = true;
      lib.printHelp(taskList, extended);
      process.exit(0);
    } else if (!argv._[0] && !argv.help) {
      lib.printHelp(taskList, extended);
      process.exit(0);
    }

    var task = this._getTask();

    if (!task.set) {
      util.fail('Error: ' + task.name + ' is not a valid task. Run `monaca --help` to show all available tasks.');
    }

    if (!terminal.isValidTask(task.name)) {
      util.fail(terminal.getInvalidCommandErrorMessage(task.name));
      process.exit(0);
    }

    if (argv.help || argv.h
      || (task.name === 'create' && argv._.length < 2 && !argv['template-list'])
      || (task.name === 'docs' && argv._.length < 2)
      || (task.name === 'remote build' && !argv.browser && !argv['build-list'] && argv._.length < 3)
      || (task.name === 'config' && !argv.reset && argv._.length < 2)
      || (task.name === 'signing' && !argv.reset && argv._.length < 2)
      )
    {
      util.displayHelp(task.name, taskList[task.set]);
      process.exit(0);
    }

    var runner = function(task) {
      var result = (require(path.join(__dirname, task.set))).run(task.name, info);
      Promise.resolve(result).then(function(result) {
        if (result && result.nextTask) {
          runner(result.nextTask);
        }
      })
    };
    runner(task);
  }
};

process.on('exit', function() {
  var data = {
    currentVersion: VERSION,
    latestVersion: latestVersion,
    config: CONFIG_FILE
  };

  util.updateCheck(data);
});

exports.Monaca = Monaca;
})();
