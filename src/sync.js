(function() {
  'use strict';

  var read = require('read'),
    argv = require('optimist').argv,
    path = require('path'),
    Q = require('q'),
    Monaca = require('monaca-lib').Monaca,
    Localkit = require('monaca-lib').Localkit;

  var util = require(path.join(__dirname, 'util'));

  var monaca = new Monaca();

  var BaseTask = require(path.join(__dirname, 'task')).BaseTask;

  var SyncTask = function(){};

  SyncTask.prototype = new BaseTask();

  SyncTask.prototype.taskList = {
    clone: {
      description: 'clone project from the Monaca Cloud',
      longDescription: [
        'Clones a project from the Monaca Cloud.',
        '',
        'The command downloads a list of available projects',
        'and then displays a list for the user to choose from.',
        '',
        'The project will be downloaded to a directory',
        'specified by the user.'
      ],
      usage: 'monaca clone',
      examples: ['monaca clone']
    },
    upload: {
      description: 'upload project to Monaca Cloud',
      longDescription: [
        'Uploads the current project to the Monaca Cloud.',
        '',
        'This command requires you to be logged in. The project',
        'files will be compared with the remote files so only',
        'changed and new files will be uploaded.'
      ],
      usage: 'monaca upload',
      examples: ['monaca upload']
    },
    download: {
      description: 'download project from Monaca Cloud',
      longDescription: [
        'Download project from the Monaca Cloud.',
        '',
        'This command will connect to the Monaca Cloud and',
        'download all the file changes that\'s been made.'
      ],
      usage: 'monaca download',
      examples: ['monaca download']
    },
    livesync: {
      description: 'starts a server that waits for connections from Monaca Debugger',
      longDescription: [
        'Debug the application on a device and receive code changes instantly.',
        '',
        'This command starts a web server for the Monaca Debugger to connect to.',
        'It also starts broadcasting messages to tell debuggers in the local network',
        'to connect to it.',
        '',
        'When a debugger has connected it will send file system changes to it.'
      ],
      options: [
        ['--port', 'http port to listen on. default is 8080.']
      ],
      usage: 'monaca livesync',
      examples: ['monaca livesync']
    },
    multiserve: {
      description: 'serves several projects to the Monaca Debugger',
      longDescription: [
        'Serve a list of projects to the Monaca Debugger.'
      ],
      options: [
        ['paths', 'list of directories']
      ],
      usage: 'monaca multiserve <paths>',
      examples: ['monaca multiserve /path/to/project /path/to/another/project']
    }
  };

  SyncTask.prototype.run = function(taskName){
    var self = this;

    if (!this.isMyTask(taskName)) {
      return;
    }

    monaca.relogin().then(
      function() {
        if (taskName === 'upload') {
          self.upload();
        }
        else if (taskName === 'download') {
          self.download();
        }
        else if (taskName === 'clone') {
          self.clone();
        }
        else if (taskName === 'multiserve') {
          self.multiserve();
        }
        else {
          self.livesync();
        }
      },
      function(error) {
        if (error === 'ECONNRESET') {
          util.err('Unable to connect to Monaca Cloud.');
          util.print('Are you connected to the Internet?');
          util.print('If you need to use a proxy, please configure it with "monaca proxy".');
        }
        else {
          util.err('Must be signed in to use this command.');
          util.print('Please sign in with \'monaca login\'.');
          util.print('If you don\'t have an account yet you can create one at https://monaca.mobi/en/register/start');
        }
      }
    );
  };

  var findProjectDir = function(cwd) {
    return monaca.isCordovaProject(cwd).then(
      function(data) {
        return cwd;
      },
      function(error) {
        var newPath = path.join(cwd, '..');

        if (newPath === cwd) {
          return Q.reject('Directory is not a Cordova project.');
        }
        else {
          return findProjectDir(newPath);
        }
      }
    );
  };

  SyncTask.prototype.upload = function() {
    findProjectDir(process.cwd()).then(
      function(cwd) {
        util.print('This operation will overwrite all remote changes that has been made.'.warn);
        read({ prompt: 'Do you want to continue? [y/N] ' }, function(error, answer) {
          if (error || answer.toLowerCase().charAt(0) !== 'y') {
            util.print('Aborting operation.');
            process.exit(1);
          }

          var assureMonacaProject = function() {
            var deferred = Q.defer();

            var getProjectId = function(projectDir) {
              return monaca.getProjectId(cwd).then(
                function(projectId) {
                  if (typeof projectId === 'undefined') {
                    return Q.reject();
                  }
                  else {
                    return projectId;
                  }
                }
              );
            };

            getProjectId(cwd).then(
              function(projectId) {
                deferred.resolve(projectId);
              },
              function(error) {
                monaca.getProjectInfo(cwd).then(
                  function(info) {
                    return monaca.createProject({
                      name: info.name,
                      description: info.description,
                      templateId: 'minimum'
                    });
                  },
                  function(error) {
                    deferred.reject(error);
                  }
                )
                .then(
                  function(info) {
                    monaca.setProjectId(cwd, info.projectId).then(
                      function(projectId) {
                        deferred.resolve(projectId);
                      },
                      function(error) {
                        deferred.reject(error);
                      }
                    );
                  },
                  function(error) {
                    deferred.reject(error);
                  }
                );
              }
            );

            return deferred.promise;
          };

          assureMonacaProject().then(
            function() {
              var nbrOfFiles = 0;

              monaca.uploadProject(cwd).then(
                function() {
                  if (nbrOfFiles === 0) {
                    util.print('No files uploaded since project is already in sync.');
                  }
                  else {
                    util.print('Project successfully uploaded to Monaca Cloud!');
                  }
                },
                function(error) {
                  util.err('Upload failed: ' + error);
                },
                function(progress) {
                  var per = 100 * (progress.index + 1) / progress.total;
                  per = per.toString().substr(0, 5) + '%';
                  util.print(('[' + per + '] ').verbose + progress.path);

                  nbrOfFiles++;
                }

              );
            },
            function(error) {
              util.err('Unable to create monaca project: ' + error);
            }
          );
        });

      },
      function(error) {
        util.err('Unable to upload project: ' + error);
      }
    );
  };

  SyncTask.prototype.download = function() {
    findProjectDir(process.cwd()).then(
      function(cwd) {
        util.print('This operation will overwrite all local changes you have made.'.warn);
        read({ prompt: 'Do you want to continue? [y/N] ' }, function(error, answer) {
          if (error || answer.toLowerCase().charAt(0) !== 'y') {
            util.print('Aborting operation.');
            process.exit(1);
          }

          var nbrOfFiles = 0;

          monaca.downloadProject(cwd).then(
            function() {
              if (nbrOfFiles === 0) {
                util.print('No files downloaded since project is already in sync.');
              }
              else {
                util.print('Project successfully downloaded from Monaca Cloud!');
              }
            },
            function(error) {
              util.err('Download failed: ' + error);
            },
            function(progress) {
              var per = 100 * (progress.index + 1) / progress.total;
              per = per.toString().substr(0, 5) + '%';
              util.print(('[' + per + '] ').verbose + progress.path);

              nbrOfFiles++;
            }
          );
        });
      },
      function(error) {
        util.err('Unable to download project: ' + error);
      }
    );
  };

  SyncTask.prototype.clone = function() {
    util.print('Fetching project list...');

    monaca.getProjects().then(
      function(projects) {
        util.print('Please choose one of the following projects:\n');

        for (var i = 0, l = projects.length; i < l; i ++) {
          var project = projects[i];

          util.print('\t' + (i + 1) + '. ' + project.name);
        }

        util.print('');

        read( { prompt: 'Project number: ' }, function(error, idx) {
          if (error) {
            util.err('Unable to read project number.');
          }
          else {
            var projectId = parseInt(idx);

            if (projectId > 0 && projectId <= projects.length) {
              var project = projects[projectId-1];

              read( { prompt: 'Destination directory: ', default: project.name, edit: true }, function(error, destPath) {
                if (destPath.trim() === '') {
                  destPath = process.cwd();
                }

                if (error) {
                  util.err('Unable to read destination directory.');
                }
                else {
                  var absolutePath = path.resolve(destPath);

                  util.print('Cloning "' + project.name + '" to ' + absolutePath); 

                  monaca.cloneProject(project.projectId, destPath).then(
                    function() {
                      util.print('Project successfully cloned from Monaca Cloud!');
                    },
                    function(error) {
                      util.err('Clone failed: ' + error);
                    },
                    function(progress) {
                      var per = 100 * (progress.index + 1) / progress.total;
                      per = per.toString().substr(0, 5) + '%';
                      util.print(('[' + per + '] ').verbose + progress.path);
                    }
                  );
                }
              });
            }
            else {
              util.err('Invalid project number.');
            }
          }
        });

      },
      function(error) {
        util.err('Unable to fetch project list: ' + error);
      }
    );
  };

  SyncTask.prototype.multiserve = function() {
    var localkit;

    try {
      localkit = new Localkit(monaca, true);
    }
    catch (error) {
      util.err('Unable to start livesync: ' + error);
    }

    var projects = argv._.slice(1);

    if (projects.length === 0) {
      util.err('You must supply a list of project directories.');
      process.exit(1);
    }

    localkit.setProjects(projects)
    .then(
      function() {
        util.print('Starting file listening.');
        return localkit.startWatch();
      },
      function(error) {
        util.err('Unable to add projects: ' + error);
        process.exit(1);
      }
    )
    .then(
      function() {
        util.print('Starting HTTP server.');
        return localkit.startHttpServer({ httPort: argv.port });
      },
      function(error) {
        util.error('Unable to start file watching: ' + error);
        process.exit(1);
      }
    )
    .then(
      function(server) {
        util.print(('Listening on ' + server.address + ':' + server.port).help);
        util.print('Starting beacon transmitter.');
        return localkit.startBeaconTransmitter();
      },
      function(error) {
        util.err('Unable to start HTTP server: ' + error);
        process.exit(1);
      }
    )
    .then(
      function() {
        util.print('Waiting for connections from Monaca debugger...'.help);
      },
      function(error) {
        util.err('Unable to start beacon transmitter: ' + error);
        process.exit(1);
      }
    );
  };

  SyncTask.prototype.livesync = function() {
    var localkit;

    try {
      localkit = new Localkit(monaca, true);
    }
    catch(error) {
      util.err('Unable to start livesync: ' + error);
      process.exit(1);
    }

    util.print('Starting HTTP server...');
    localkit.startHttpServer({ httpPort: argv.port }).then(
      function(server) {
        util.print('HTTP server started.');
        util.print(('Listening on ' + server.address + ':' + server.port).help);
        util.print('Starting beacon transmitter...');

        // Send "exit" event when program is terminated.
        process.on('SIGINT', function() {
          util.print('Stopping livesync...');
          this.sendExitEvent();
          process.exit(0);
        }.bind(localkit.projectEvents));

        localkit.startBeaconTransmitter().then(
          function() {
            util.print('Beacon transmitter started.');
            util.print('Waiting for connections from Monaca debugger...'.help);

            var projectPath = process.cwd();

            localkit.addProject(projectPath).then(
              function() {
                return monaca.getLocalProjectId(projectPath);
              },
              function(error) {
                util.err('Unable to add project: ' + error);
                process.exit(1);
              }
            )
            .then(
              function(projectId) {
                localkit.projectEvents.sse.on('connection', function(client) {
                  localkit.projectEvents.sendMessage({
                    action: 'start',
                    projectId: projectId
                  }, client);
                });

                return localkit.startWatch();
              },
              function(error) {
                util.err('Unable to get project id: ' + error);
              }
            )
            .then(
              function() {
                util.print('Started file watching.');
                return localkit.startProject(projectPath);
              },
              function(error) {
                util.err('Unable to start file watching: ' + error);
                process.exit(1);
              }
            );

          },
          function(error) {
            util.err('Unable to start beacon transmitter: ' + error);
            process.exit(1);
          }
        );
      },
      function(error) {
        util.err('Unable to start HTTP server: ' + error); 
        util.print('This is probably due to the port already being in use. Please use --port option to change port.');
        process.exit(1);
      }
    );
  };

  exports.SyncTask = SyncTask;
})();
