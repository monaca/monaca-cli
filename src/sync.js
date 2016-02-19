(function() {
  'use strict';

  var read = require('read'),
    argv = require('optimist').argv,
    path = require('path'),
    Q = require(path.join(__dirname, 'qustom')),
    child_process = require('child_process'),
    Monaca = require('monaca-lib').Monaca,
    Localkit = require('monaca-lib').Localkit,
    util = require(path.join(__dirname, 'util'));

  var monaca = new Monaca();

  var SyncTask = {};

  SyncTask.run = function(taskName) {
    monaca.relogin().then(
      function() {
        if (taskName === 'upload') {
          this.upload();
        } else if (taskName === 'download') {
          this.download();
        } else if (taskName === 'clone') {
          // true flag ensures that cloud project id is saved locally.
          this.clone(true);
        } else if (taskName === 'import') {
          this.clone(false);
        } else if (taskName === 'multiserve') {
          this.multiserve();
        } else {
          this.livesync();
        }
      }.bind(this),
      function(error) {
        if (error === 'ECONNRESET') {
          util.err('Unable to connect to Monaca Cloud.');
          util.print('Are you connected to the Internet?');
          util.print('If you need to use a proxy, please configure it with "monaca proxy".');
        } else {
          util.err('Must be signed in to use this command.');
          util.print('Please sign in with \'monaca login\'.');
          util.print('If you don\'t have an account yet you can create one at https://monaca.mobi/en/register/start');
        }
      }
    );
  };

  var findProjectDir = function(cwd) {
    return monaca.isMonacaProject(cwd).then(
      function(data) {
        return cwd;
      },
      function(error) {
        var newPath = path.join(cwd, '..');

        if (newPath === cwd) {
          return Q.reject('Directory is not a Monaca project.');
        } else {
          return findProjectDir(newPath);
        }
      }
    );
  };

  SyncTask.upload = function() {
    var options = {};
    if (argv["dry-run"]) {
      options.dryrun = true;
    }
    if (argv.delete) {
      options.delete = true;
    }
    if (argv.force) {
      options.force = true;
    }
    findProjectDir(process.cwd()).then(
      function(cwd) {
        var assureMonacaProject = function() {
          var deferred = Q.defer();

          var getProjectId = function(projectDir) {
            return monaca.getProjectId(cwd).then(
              function(projectId) {
                if (typeof projectId === 'undefined') {
                  return Q.reject();
                } else {
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

        var upload = function(cwd) {
          assureMonacaProject().then(
            function() {
              var nbrOfFiles = 0;

              monaca.uploadProject(cwd, options).then(
                function(files) {
                  if (options.dryrun && !options.force) {
                    if (files && Object.keys(files.uploaded).length > 0) {
                      util.print("Following files will be uploaded.")
                      util.print(Object.keys(files.uploaded).map(
                          function(file, index) {
                            return (index + 1) + ". " + file;
                          })
                        .join("\n")
                      );
                    } else {
                      util.print('No files will be uploaded since project is already in sync.');
                    }
                    if (options.delete) {
                      if (files && Object.keys(files.deleted).length > 0) {
                        util.print("\nFollowing files will be deleted on Monaca Cloud.")
                        util.print(Object.keys(files.deleted).map(
                            function(file, index) {
                              return (index + 1) + ". " + file;
                            })
                          .join("\n")
                        );
                      } else {
                        util.print('\nNo files will be deleted on Monaca Cloud.');
                      }
                    }
                  } else {
                    if (nbrOfFiles === 0) {
                      util.print('No files uploaded since project is already in sync.');
                    } else {
                      util.print('Project successfully uploaded to Monaca Cloud!');
                    }
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
        }

        // If --dry-run or --force option is used then no need to show warning message to user.
        if (options.dryrun || options.force) {
          upload(cwd);
        } else {
          util.print('This operation will overwrite all remote changes that has been made.'.warn);
          read({
            prompt: 'Do you want to continue? [y/N] '
          }, function(error, answer) {
            if (error || answer.toLowerCase().charAt(0) !== 'y') {
              util.print('Aborting operation.');
              process.exit(1);
            } else {
              upload(cwd);
            }
          });
        }
      },
      function(error) {
        util.err('Unable to upload project: ' + error);
      }
    );
  };

  SyncTask.download = function() {
    var options = {};
    if (argv["dry-run"]) {
      options.dryrun = true;
    }
    if (argv.delete) {
      options.delete = true;
    }
    if (argv.force) {
      options.force = true;
    }
    findProjectDir(process.cwd()).then(
      function(cwd) {
        var download = function(cwd) {
          var nbrOfFiles = 0;
          monaca.downloadProject(cwd, options).then(
            function(files) {
              if (options.dryrun && !options.force) {
                if (files && Object.keys(files.remoteFiles).length > 0) {
                  util.print("Following files will be downloaded.");
                  util.print(Object.keys(files.remoteFiles).map(
                      function(file, index) {
                        return (index + 1) + ". " + file;
                      })
                    .join("\n")
                  );
                } else {
                  util.print('No files will be downloaded since project is already in sync.');
                }
                if (options.delete) {
                  if (files && Object.keys(files.deleted).length > 0) {
                    util.print("\nFollowing files will be deleted locally.");
                    util.print(Object.keys(files.deleted).map(
                        function(file, index) {
                          return (index + 1) + ". " + file;
                        })
                      .join("\n")
                    );
                  } else {
                    util.print('\nNo files will be deleted locally.');
                  }
                }
              } else {
                if (nbrOfFiles === 0) {
                  util.print('No files downloaded since project is already in sync.');
                } else {
                  util.print('Project successfully downloaded from Monaca Cloud!');
                }
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
        }

        // If user is dry running 'monaca download' or forcing it then no need to show warning message.
        if (options.dryrun || options.force) {
          download(cwd);
        } else {
          util.print('This operation will overwrite all local changes you have made.'.warn);
          read({
            prompt: 'Do you want to continue? [y/N] '
          }, function(error, answer) {
            if (error || answer.toLowerCase().charAt(0) !== 'y') {
              util.print('Aborting operation.');
              process.exit(1);
            } else {
              download(cwd);
            }
          });
        }

      },
      function(error) {
        util.err('Unable to download project: ' + error);
      }
    );
  };

  SyncTask.clone = function(saveCloudProjectID) {
    util.print('Fetching project list...');
    var project;
    monaca.getProjects().then(
      function(projects) {
        util.print('Please choose one of the following projects:\n');

        for (var i = 0, l = projects.length; i < l; i++) {
          var project = projects[i];
          util.print('\t' + (i + 1) + '. ' + project.name);
        }
        util.print('');

        var question = function() {
          read({
            prompt: 'Project number: '
          }, function(error, idx) {
            if (error) {
              util.err('Unable to read project number.');
            } else {
              var projectId = parseInt(idx);
              if (projectId > 0 && projectId <= projects.length) {
                project = projects[projectId - 1];
                clone();
              } else {
                question();
              }
            }
          });
        }

        question();

        var clone = function() {
          read({
            prompt: 'Destination directory: ',
            default: project.name,
            edit: true
          }, function(error, destPath) {
            if (destPath.trim() === '') {
              destPath = process.cwd();
            }

            if (error) {
              util.err('Unable to read destination directory.');
            } else {
              var absolutePath = path.resolve(destPath);
              var action = saveCloudProjectID ? "Cloning" : "Importing";
              util.print(action + ' "' + project.name + '" to ' + absolutePath);

              monaca.cloneProject(project.projectId, destPath).then(
                function() {
                  var action = saveCloudProjectID ? "cloned" : "imported";
                  util.print('Project successfully ' + action + ' from Monaca Cloud!');
                  if (saveCloudProjectID) {
                    monaca.setProjectId(absolutePath, project.projectId).then(
                      function() {
                        // project id is saved in local .json file
                      },
                      function(error) {
                        util.err("Project is cloned to given location but Cloud project ID for this project could not be saved. \nThis project is not linked with corresponding project on Monaca Cloud.");
                      }
                    )
                  }
                },
                function(error) {
                  util.err('Clone failed: ' + JSON.stringify(error));
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

      },
      function(error) {
        util.err('Unable to fetch project list: ' + error);
      }
    );
  };

  var loadInspector = function(localkit) {
    try {
      var nwBin = require('nw').findpath();

      localkit.initInspector({
        inspectorCallback: function(result) {
          child_process.spawn(nwBin, [result.app, result.webSocketUrl]);
        }
      });
    } catch (error) {
      if ( error.code === 'MODULE_NOT_FOUND' ) {
        util.warn('Node-webkit (NW.js) module is not installed. Inspector utilities will be disabled. \nPlease install NW.js with \'npm install nw\' and restart the livesync or use Chrome Web Inspector instead.\n')
      }
    }
  };

  SyncTask.multiserve = function() {
    var localkit;

    try {
      localkit = new Localkit(monaca, true);
    } catch (error) {
      util.err('Unable to start livesync: ' + error);
    }

    loadInspector(localkit);

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
          return localkit.startHttpServer({
            httPort: argv.port
          });
        },
        function(error) {
          util.err('Unable to start file watching: ' + error);
          process.exit(1);
        }
      )
      .then(
        function(server) {

          // Send "exit" event when program is terminated.
          process.on('SIGINT', function() {
            util.print('Stopping multiserve...');
            this.sendExitEvent();
            process.exit(0);
          }.bind(localkit.projectEvents));

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

  SyncTask.livesync = function() {
    var localkit;

    try {
      localkit = new Localkit(monaca, true);
    } catch (error) {
      util.err('Unable to start livesync: ' + error);
      process.exit(1);
    }

    loadInspector(localkit);

    util.print('Starting HTTP server...');
    localkit.startHttpServer({
      httpPort: argv.port
    }).then(
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

  module.exports = SyncTask;
})();
