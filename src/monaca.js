var argv = require('optimist').argv,
    colors = require('colors'),
    fs = require('fs'),
    path = require('path'),
    read = require('read'),
    semver = require('semver'),
    Monaca = require('monaca-lib').Monaca,
    Q = require('q');

var monaca = new Monaca();

var util = require(path.join(__dirname, 'util'));

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

var taskList = [
    new (require(path.join(__dirname, 'create')).CreateTask)(),
    new (require(path.join(__dirname, 'cordova')).CordovaTask)(),
    new (require(path.join(__dirname, 'serve')).ServeTask)(),
    new (require(path.join(__dirname, 'auth')).AuthTask)(),
    new (require(path.join(__dirname, 'sync')).SyncTask)(),
    new (require(path.join(__dirname, 'remote')).RemoteTask)(),
    new (require(path.join(__dirname, 'config')).ConfigTask)()
];

var VERSION = require(path.join(__dirname, '..', 'package.json')).version;

var Monaca = {
    _getTask: function() {
        var taskName = '',
          i, j;

        for (i = 0; i < argv._.length; i++) {
          var v = argv._[i];
          taskName = [taskName, v].join(' ').trim();

          for (j = 0; j < taskList.length; j++) {
            var task = taskList[j];

            if (task.isMyTask(taskName)) {
              return [task, taskName];
            }
          }
        }
    },
    run: function() {
        var taskName = argv._.length ? argv._[0] : null;

        this.checkVersion()
        .then(
          function() {

            // version
            if (taskName === 'version' || argv.version || argv.v) {
                this.printVersion();
                return;
            }

            // help
            if (!taskName || taskName === 'help') {
                this.printHelp();
                return;
            }

            var ret = this._getTask();

            if (!ret) {
                process.stderr.write(('Error: ' + taskName + ' is not a valid task.\n').error);
                process.exit(1);
            }

            var task = ret[0];
            taskName = ret[1];

            var taskNameParts = taskName.split(' ').length;

            if (argv._[taskNameParts] === 'help' || argv.help || argv.h) {
              task.displayHelp(taskName);
            }
            else {
              task.run(taskName);
            }
          }.bind(this),
          function(err) {
            util.err(err);
          }
        )
    },
    printVersion: function() {
        console.log(VERSION.info.bold);
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

      var tasks = taskList.map(function(task) {
        return Object.keys(task.taskList).map(function(key) {
          if (task.taskList[key].showInHelp !== false) {
            return [key, task.taskList[key].description];
          }
          else {
            return ["",""];
          }
        });
      })
      .reduce(function(a, b) {
        return a.concat(b);
      })
      .filter(function(a) {
        return a.join("") !== "";
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
    },
    checkVersion: function() {
      var deferred = Q.defer();

      var keys = {}
        , filePath = path.join(__dirname, '..', 'keys.json')
        , timestamp;

      // Check if version check was performed in last 8 hours.
      if (fs.existsSync(filePath)) {
        keys = JSON.parse(fs.readFileSync(filePath).toString());
        if (keys['timestamp']) {
          var d1 = new Date(keys['timestamp']);
          d1.setHours(d1.getHours() + 8);
          if (d1 > new Date()) {
            // Check was performed within last 8 hours, abort version check.
            deferred.resolve();
          }
        }
      }
      // Set current timestamp.
      keys['timestamp'] = new Date();

      // Write latest timestamp to file.
      var writeToFile = function(keys) {
        fs.writeFileSync(filePath, JSON.stringify(keys));
      }

      var performCheck = function() {
        monaca.getLatestVersionInfo().then(
          function(data) {
            if (data.status === 'ok') {
              if (data.result && data.result.monacaCli) {
                  if (semver.gt(data.result.monacaCli, VERSION)) {
                      read({ prompt: 'The latest version ' + data.result.monacaCli + ' is released. Do you want to update? [y/N] ' }, function(error, answer) {
                        writeToFile(keys);
                        if (!error && answer.toLowerCase().charAt(0) == 'y') {
                          util.print("Please use npm -g install monaca to update me.".bold)
                          process.exit(1);
                        } else {
                          deferred.resolve();
                        }
                    });
                  } else {
                    writeToFile(keys);
                    deferred.resolve();
                  }
              }
            } else {
              deferred.resolve();
            }
          }.bind(this),
          function(err) {
            deferred.reject(err);
          }
        );
      }
      performCheck();
      return deferred.promise;
    }
};

exports.Monaca = Monaca;
