(function() {
'use strict';

var argv = require('optimist').argv,
  colors = require('colors'),
  fs = require('fs'),
  path = require('path'),
  util = require(path.join(__dirname, 'util')),
  monaca = require('monaca-lib').Monaca,
  compareVersions = require('compare-versions'),
  Q = require('q');

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
var info = {
  clientType: 'cli',
  clientVersion: VERSION
};
var m = new monaca(info);

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
    m.getLatestVersionInfo()
    .then(this.compareCLIVersion.bind(this))
    .then(this.printUpdateInfo.bind(this))
    .catch(function(error) {
      return Q.resolve();
    })
    .then(function() {
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
        || (task.name === 'docs' && argv._.length < 2)
        || (task.name === 'remote build' && !argv.browser && argv._.length < 3)
        || (task.name === 'config' && !argv.reset && argv._.length < 2)) {
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
    }.bind(this));
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
    showAll = !!showAll;
    util.print('Commands: (use --all to show all)\n');

    var taskMaxLength = 0;
    var tasks = Object.keys(taskList)
      .map(function(taskSet) {
        return Object.keys(taskList[taskSet]).map(function(taskName) {
          var task = taskList[taskSet][taskName];
          if (task.showInHelp !== false || showAll) {
            if (showAll && task.aliases) {
              taskName += ' | ' + task.aliases.join(' | ');
            }
            taskMaxLength = Math.max(taskMaxLength, taskName.length + 3);
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
        dots = new Array(Math.max(15, taskMaxLength) - cmd.length).join('.');
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
  },
  printUpdateInfo: function(newVersion) {
    var currentTime = new Date();
    var printUpdate = function() {
      util.print('-----------------------------------------------------------------------------------------'.help);
      util.print('Version '.help + newVersion.help.bold + ' of Monaca CLI is now available. To update it run:'.help);
      util.print('               npm install -g monaca '.success);
      util.print('-----------------------------------------------------------------------------------------'.help);
    };

    var deferred = Q.defer();
    try {
      if (newVersion !== undefined) {
        return util.getCLIUpdate(m.userCordova, 'lastShown')
          .then(function(lastUpdate) {
            if(lastUpdate === undefined || currentTime.setHours(currentTime.getHours() + 6) > lastUpdate.showedAt) {
              printUpdate();
              return util.setCLIUpdate(m.userCordova, 'lastShown', currentTime.getTime());
            } else {
              deferred.resolve();
            }
          });
      } else {
        deferred.resolve();
      }
    } catch (error) {
      return deferred.reject(error);
    }
    return deferred.promise;
  },
  compareCLIVersion: function(info) {
    try {
      var getCurrentCLIVersion =  function() {
        try {
          var cliPackageJSONPath = path.resolve(path.join(__dirname, '..', 'package.json')),
            version = require(cliPackageJSONPath).version;
          return Q.resolve(version);
        } catch (error) {
          return Q.reject(error);
        }
      };

      return getCurrentCLIVersion()
        .then(function(version) {
          var latestVersion = info.result.monacaCli.replace(/"/g,'').split('/').pop();
          var result = compareVersions(version, latestVersion);

          if(result === -1) {
            return Q.resolve(latestVersion);
          } else {
            return Q.resolve();
          }
        });
    } catch (error) {
      return Q.reject(error);
    }
  }
};

exports.Monaca = Monaca;
})();
