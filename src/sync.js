(function() {
'use strict';

var read = require('read'),
  argv = require('optimist').argv,
  path = require('path'),
  Q = require('q'),
  child_process = require('child_process'),
  Monaca = require('monaca-lib').Monaca,
  Localkit = require('monaca-lib').Localkit,
  lib = require(path.join(__dirname, 'lib')),
  util = require(path.join(__dirname, 'util'));

var monaca = new Monaca();

var SyncTask = {};

SyncTask.run = function(taskName) {
  monaca.relogin().then(
    function() {
      if (taskName === 'clone') {
        this.clone(true); // 'true' flag ensures that cloud project id is saved locally.
      } else if (taskName === 'import') {
        this.clone(false);
      } else if (taskName === 'livesync') {
        this.livesync();
      } else if (taskName === 'upload' || taskName === 'download') {
        this.load(taskName);
      }
    }.bind(this),
    util.displayLoginErrors
  );
};

SyncTask.load = function(action) {
  var cwd, options = {};
  options.dryrun = argv['dry-run'];
  options.delete = argv.delete;
  options.force = argv.force;
  options.action = action;

  lib.confirmOverwrite(options)
    // Waiting for user permission.
    .then(
      function() {
        return lib.findProjectDir(process.cwd(), monaca);
      },
      util.fail
    )
    // Checking project directory.
    .then(
      function(directory) {
        cwd = directory;
        if (action === 'upload') {
          return lib.assureMonacaProject(cwd, monaca);
        }
      },
      util.fail.bind(null, 'Unable to ' + action + ' project: ')
    )
    // Assuring this is a Monaca-like project (if uploading).
    .then(
      function() {
        return monaca[action + 'Project'](cwd, options);
      },
      util.fail.bind(null, 'Unable to create monaca project: ')
    )
    // Uploading/Downloading project to Monaca Cloud.
    .then(
      lib.printSuccessMessage.bind(null, options),
      util.fail.bind(null, action.toUpperCase() + ' failed: '),
      util.displayProgress
    );
};

SyncTask.clone = function(saveCloudProjectID) {
  util.print('Fetching project list...');
  var project;

  monaca.getProjects()
    // Getting project list.
    .then(
      function(projects) {
        util.print('Please choose one of the following projects:\n');

        for (var i = 0, l = projects.length; i < l; i++) {
          util.print(' ' + (i + 1) + '. ' + projects[i].name);
        }

        util.print('');

        var deferred = Q.defer();
        var question = function() {
          read({
            prompt: 'Project number: '
          }, function(error, idx) {
            if (error) {
              deferred.reject('Unable to read project number.');
            } else {
              var projectId = parseInt(idx);

              if (projectId > 0 && projectId <= projects.length) {
                project = projects[projectId - 1];
                return deferred.resolve(project);
              }

              question();
            }
          });
        };
        question();

        return deferred.promise;
      },
      util.fail.bind(null, 'Unable to fetch project list: ')
    )
    // Waiting for user input - Project number.
    .then(
      function(project) {
        var deferred = Q.defer();
        read({
          prompt: 'Destination directory: ',
          default: project.name,
          edit: true
        }, function(error, destPath) {
          if (error) {
            return deferred.reject('Unable to read destination directory.');
          }

          if (destPath.trim() === '') {
            destPath = process.cwd();
          }
          project.destPath = destPath;
          project.absolutePath = path.resolve(destPath);

          deferred.resolve();
        });

        return deferred.promise;
      },
      util.fail
    )
    // Waiting for user input - Destination directory.
    .then(
      function() {
        util.print((saveCloudProjectID ? 'Cloning' : 'Importing') + ' \'' + project.name + '\' to ' + project.absolutePath);

        return monaca.cloneProject(project.projectId, project.destPath);
      },
      util.fail
    )
    // Cloning project.
    .then(
      function() {
        util.success('\nProject successfully ' + (saveCloudProjectID ? 'cloned' : 'imported') + ' from Monaca Cloud!');

        if (saveCloudProjectID) {
          monaca.setProjectId(project.absolutePath, project.projectId).catch(function(error) {
            util.err('\nProject is cloned to given location but Cloud project ID for this project could not be saved. \nThis project is not linked with corresponding project on Monaca Cloud.');
          });
        }
      },
      util.fail.bind(null, '\nClone failed: '),
      util.displayProgress
    );
};

SyncTask.livesync = function() {
  var localkit;

  try {
    localkit = new Localkit(monaca, true);
  } catch (error) {
    util.fail('Unable to start livesync: ', error);
  }

  try {
    var nwBin = require('nw').findpath();

    localkit.initInspector({
      inspectorCallback: function(result) {
        child_process.spawn(nwBin, [result.app, result.webSocketUrl]);
      }
    });
  } catch (error) {
    if ( error.code === 'MODULE_NOT_FOUND' ) {
      util.warn('Node-webkit (NW.js) module is not installed. Inspector utilities will be disabled. \nPlease install NW.js with \'npm install nw\' and restart the livesync or use Chrome Web Inspector instead.\n');
    }
  }

  var projects = argv._.slice(1);

  if (projects.length === 0) {
    projects.push('.');
  }

  localkit.setProjects(projects)
    // Adding projects.
    .then(
      function() {
        util.print('Starting file watching...');
        return localkit.startWatch();
      },
      util.fail.bind(null, 'Unable to add projects: ')
    )
    // Starting file watching.
    .then(
      function() {
        util.print('Starting HTTP server...');
        return localkit.startHttpServer({ httPort: argv.port });
      },
      util.fail.bind(null, 'Unable to start file watching: ')
    )
    // Starting HTTP server.
    .then(
      function(server) {

        // Send "exit" event when program is terminated.
        process.on('SIGINT', function() {
          util.print('Stopping livesync...');
          this.sendExitEvent();
          process.exit(0);
        }.bind(localkit.projectEvents));

        util.print(('Listening on ' + server.address + ':' + server.port).help);
        util.print('Starting beacon transmitter...');
        return localkit.startBeaconTransmitter();
      },
      util.fail.bind(null, 'Unable to start HTTP server: ')
    )
    // Starting beacon transmiter.
    .then(
      function() {
        util.print('Waiting for connections from Monaca debugger...'.help);
      },
      util.fail.bind(null, 'Unable to start beacon transmitter: ')
    );
};

module.exports = SyncTask;
})();
