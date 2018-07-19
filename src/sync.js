(function() {
'use strict';

var inquirer = require('monaca-inquirer'),
  argv = require('optimist').argv,
  path = require('path'),
  Q = require('q'),
  child_process = require('child_process'),
  Monaca = require('monaca-lib').Monaca,
  Localkit = require('monaca-lib').Localkit,
  lib = require(path.join(__dirname, 'lib')),
  util = require(path.join(__dirname, 'util'));

var SyncTask = {}, monaca;

SyncTask.run = function(taskName, info, options) {
  monaca = new Monaca(info);
  if (taskName === 'debug') {
    return monaca.relogin().then(this.livesync.bind(this), function() {
      return util.displayLoginErrors();
    }.bind(this));
  } else {
    return monaca.prepareSession().then(
      function() {
        if (taskName === 'clone') {
          this.clone(true); // 'true' flag ensures that cloud project id is saved locally.
        } else if (taskName === 'import') {
          this.clone(false);
        } else if (taskName === 'upload' || taskName === 'download') {
          this.load(taskName, options);
        }
      }.bind(this),
      util.displayLoginErrors
    );
  }
};

SyncTask.load = function(action, arg) {
  var cwd, options = {}, error = '';
  options.dryrun = argv['dry-run'] || (arg && arg.dryrun);
  options.delete = argv.delete || (arg && arg.delete);
  options.force = argv.force || (arg && arg.force);
  options.skipTranspile = argv.skipTranspile || (arg && arg.skipTranspile);
  options.action = action;

  var report = {
    event: action
  };
  monaca.reportAnalytics(report);

  lib.confirmOverwrite(options)
    // Waiting for user permission.
    .then(
      function() {
        error = 'Unable to ' + action + ' project: ';
        return lib.findProjectDir((arg && arg.projectDir) || process.cwd(), monaca);
      }
    )
    // Checking project directory.
    .then(
      function(directory) {
        error = 'Unable to create monaca project: ';
        cwd = directory;

        if (action === 'upload') {
          return lib.assureMonacaProject(cwd, monaca);
        }
      }
    )
    // Assuring this is a Monaca-like project (if uploading).
    .then(
      function() {
        var isTranspileEnabled = monaca.isTranspileEnabled(cwd);

        if (isTranspileEnabled) {
          util.checkNodeRequirement();
        }

        error = action.toUpperCase() + ' failed: ';
        return monaca[action + 'Project'](cwd, options)
          .progress(util.displayProgress);
      }
    )
    // Uploading/Downloading project to Monaca Cloud.
    .then(
      monaca.reportFinish.bind(monaca, report),
      monaca.reportFail.bind(monaca, report)
    )
    // Reporting analytics
    .then(
      lib.printSuccessMessage.bind(null, options),
      util.fail.bind(null, error)
    );
};

SyncTask.clone = function(saveCloudProjectID) {
  util.print('Fetching project list...');
  var project;

  var report = {
    event: 'clone'
  };
  monaca.reportAnalytics(report);

  monaca.getProjects()
    .then(
      function(projects) {
        return inquirer.prompt([
          {
            type: 'list',
            name: 'projectIndex',
            message: 'Which project would you like to synchronize?',
            choices: projects.map(function(p, i) { p.value = i; return p; })
          },
          {
            type: 'input',
            name: 'destPath',
            message: 'Destination directory:',
            default: function(answers) {
              return projects[answers.projectIndex].name.replace(/\s+/g, '_');
            }
          }
        ]
        ).then(
          function(answers) {
            project = projects[answers.projectIndex];
            project.destPath = answers.destPath;
            project.absolutePath = path.resolve(answers.destPath);

            report.arg1 = project.name;
            return project;
          }
        );
      }
    )
    // Waiting for user input - Destination directory.
    .then(
      function() {
        util.print((saveCloudProjectID ? 'Cloning' : 'Importing') + ' \'' + project.name + '\' to ' + project.absolutePath);
        return monaca.cloneProject(project.projectId, project.destPath)
          .progress(util.displayProgress);
      }
    )
    // Cloning project.
    .then(
      monaca.reportFinish.bind(monaca, report),
      monaca.reportFail.bind(monaca, report)
    )
    // Reporting analytics
    .then(
      function() {
        util.success('\nProject successfully ' + (saveCloudProjectID ? 'cloned' : 'imported') + ' from Monaca Cloud!');

        if (saveCloudProjectID) {
          return monaca.setProjectId(project.absolutePath, project.projectId).catch(function(error) {
            util.err('\nProject is cloned to given location but Cloud project ID for this project could not be saved. \nThis project is not linked with corresponding project on Monaca Cloud.');
          });
        }
      },
      util.fail.bind(null, '\nClone failed: ')
    );
};

SyncTask.livesync = function() {
  var localkit, nwError = false;

  try {
    localkit = new Localkit(monaca, false);
  } catch (error) {
    return monaca
      .reportFail(report, 'Unable to start debug: ' + util.parseError(error))
      .catch(util.fail);
  }

  if (Object.keys(localkit.pairingKeys).length == 0) {
    util.print('');
    util.print('Welcome to Monaca debug - Live-reload and debug in the real device');
    util.print('');
    util.print('To get started, you need to install Monaca Debugger on your phone.')
    util.print('');
    util.print('   For Android Devices: Search and install "Monaca" in Google Play');
    util.print('   For iOS Devices: Search and install "Monaca" in App Store');
    util.print('')
    util.print('After installation, connect your device to the same WiFi network');
    util.print('and it will find this computer for pairing.')
    util.print('')
    util.print('Debugging Guide (JavaScript Dev Tools)')
    util.print('  https://docs.monaca.io/en/manual/debugger/debug/#debugger-with-local-tools')
    util.print('')
    util.print('Troubleshooting Guide:')
    util.print('  https://docs.monaca.io/en/manual/debugger/troubleshooting')
    util.print('')
  } else {
    util.print('Please run Monaca Debugger on your device.');
    util.print('')
    util.print('Debugging Guide (JavaScript Dev Tools)')
    util.print('  https://docs.monaca.io/en/manual/debugger/debug/#debugger-with-local-tools')
    util.print('')
    util.print('Troubleshooting Guide:')
    util.print('  https://docs.monaca.io/en/manual/debugger/troubleshooting')
    util.print('')
  }

  try {
    localkit.on('debuggerConnected', function(client) {
      util.print('Debugger connected: ' + client.deviceManufacturer + ' ' + client.deviceType);
    })
    localkit.on('debuggerDisconnected', function(client) {
      util.print('Debugger disconnected: ' + client.deviceManufacturer + ' ' + client.deviceType);
    })
    localkit.on('httpResponse', function(response) {
      util.print(' ' + response.message + ' > ' + response.code);
    })
    localkit.on('inspectorError', function(error) {
      switch (error) {
      case 'ERROR_ADB':
        util.print();
        util.err('Error running ADB command.');
        util.err('Make sure you installed Android SDK and adb is in your PATH.');
        util.print('Download site: http://developer.android.com/sdk/index.html')
        util.print();
        break;
      case 'ERROR_START_PROXY':
        util.err('Failed starting the proxy. Check if iOS device is properly connected and authorized.');
        break;
      default:
        util.err('Error launching inspector. Please check the connection to the device. ERRNO=' + error);
        util.print('Troubleshooting Guide: https://docs.monaca.io/en/manual/debugger/troubleshooting/');
        break;
      }
    });
  } catch (error) { }

  lib.findProjectDir(process.cwd(), monaca)
  .then(
    function(dir) {
      var projectDir = dir;

      try {
        var nw = path.join(projectDir, 'node_modules', 'nw');
        var nwBin = require(nw).findpath();
        var adbPath =  path.join(__dirname, '..', 'bin', process.platform, (process.platform == "win32") ? 'adb.exe' : 'adb');

        localkit.initInspector({
          inspectorCallback: function(result) {
            child_process.spawn(nwBin, [result.app, result.webSocketUrl]);
          },
          adbPath: adbPath
        });
      } catch (error) {
        if ( error.code === 'MODULE_NOT_FOUND' ) {
          nwError = true;
        }
      }

      var projects = argv._.slice(1);

      if (projects.length === 0) {
        projects.push(projectDir);
      }

      var report = {
        event: 'debug',
        arg1: JSON.stringify(projects)
      };
      monaca.reportAnalytics(report);

      if (projects.length > 1) {
        projects = [projects.shift()];
        util.err('Only one project can be served at the same time. Serving ', projects[0]);
      }


      var error = 'Unable to add projects: ';

      localkit.setProjects(projects)
        // Adding projects.
        .then(
          function() {
            // Starting file watching
            error = 'Unable to start file watching: ';
            return localkit.startWatch();
          }
        )
        .then(
          function() {
            // Starting HTTP server
            error = 'Unable to start HTTP server: ';
            return localkit.startHttpServer({ httpPort: argv.port });
          }
        )
        // Starting HTTP server.
        .then(
          function(server) {
            // Send "exit" event when program is terminated.
            process.on('SIGINT', function() {
              util.print('\nStopping debug...');
              this.sendExitEvent();
              process.exit(0);
            }.bind(localkit.projectEvents));

            util.print('Waiting for Monaca Debugger connecting to ' + server.address + ':' + server.port + '.');
            error = 'Unable to start beacon transmitter: ';
            return localkit.startBeaconTransmitter();
          }
        )
        // Starting beacon transmiter.
        .then(
          function() {
            if (nwError) {
              util.warn('\nNode Webkit is not installed, so inspector capabilities will be disabled.\nPlease run "npm install nw@0.26.6" and restart the debug.\n');
            }
          }
        )
        .then(
          monaca.reportFinish.bind(monaca, report),
          monaca.reportFail.bind(monaca, report)
        )
        .then(
          function() {
            var options = {
              watch: true,
              cache: true
            };

            var promises = [];
            projects.forEach(function(project) {
              var cb = function(data) {
                if (data.type == 'lifecycle') {
                  if (data.action == 'start-compile') {
                    localkit.stopWatchProject(project);
                    // console.log('------------- stopWatchProject');
                  } else if (data.action == 'end-compile') {
                    localkit.startWatchProject(project);
                    // console.log('------------- startWatchProject');
                  }
                }
              };
              promises.push(monaca.transpile(project, options,cb))
            });

            return Q.all(promises);
          }
        )
        .catch(
          util.fail.bind(null, error, '\n')
        );
    }
  )
  .catch(util.fail.bind(null, 'Operation failed: '));
};

module.exports = SyncTask;
})();
