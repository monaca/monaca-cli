(function() {
  'use strict';

  var path = require('path'),
    open = require('open'),
    argv = require('optimist').argv,
    fs = require('fs'),
    shell = require('shelljs'),
    Monaca = require('monaca-lib').Monaca,
    Q = require('q'),
    util = require(path.join(__dirname, 'util'));

  var monaca = new Monaca();

  var BaseTask = require(path.join(__dirname, 'task')).BaseTask;

  var RemoteTask = function(){};

  RemoteTask.prototype = new BaseTask();

  RemoteTask.prototype.taskList = {
    'remote build': {
      description: 'build project on Monaca Cloud',
      longDescription: [
        'Build the project on Monaca Cloud.'
      ],
      usage: ['monaca remote build'],
      options: [
        ['--platform', 'Should be one of - ios, android, windows'],
        ['--build-type', 'Should be one of - debug (for iOS, Android and Windows. It is default option.)'],
        ['', '  - release (for iOS and Android)'],
        ['--output', 'The path in which the built file will be stored (specify also the filename)'],
        ['--android_webview', 'If platform is android. Should be one of - default, crosswalk'],
        ['--android_arch', 'Required if --android_webview is crosswalk. Should be one of - x86, arm']
      ],
      examples: [
        'monaca remote build --platform=ios --build-type=test',
        'monaca remote build --platform=android --build-type=debug --android_webview=crosswalk --android_arch=arm'
      ]
    }
  };

  RemoteTask.prototype.run = function(taskName) {
    var self = this;

    if (!this.isMyTask(taskName)) {
      return;
    }

    monaca.relogin()
    .then(
      function() {
        var task = argv._[1];

        if (task === 'build') {
          self.build();
        } else {
          util.err('No such command.');
          process.exit(1);
        }
      },
      function() {
        util.err('Must be signed in to use this command.');
        util.print('Please sign in with \'monaca login\'.');
        util.print('If you don\'t have an account yet you can create one at https://monaca.mobi/en/register/start');
        process.exit(1);
      }
    );
  };

  RemoteTask.prototype.build = function() {
    var params = {};

    if (argv.platform) {
      params.platform = argv.platform;
    }

    if (argv['build-type']) {
      params.purpose = argv['build-type'];
    }

    if (argv.android_webview) {
      params.android_webview = argv.android_webview;
    }

    if (argv.android_arch) {
      params.android_arch = argv.android_arch;
    }

    if (argv.email) {
      params.email = argv.email;
    }

    if (argv.output) {
      params.output = argv.output;
    }

    var findProjectDir = function(cwd) {
      return monaca.isMonacaProject(cwd)
      .then(
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

    var projectInfo = {};
    var assureMonacaProject = function(cwd) {
      var deferred = Q.defer();
      var getProjectId = function(projectDir) {
        return monaca.getProjectId(projectDir)
        .then(
          function(projectId) {
            if (typeof projectId === 'undefined') {
              return Q.reject();
            } else {
              return projectId;
            }
          }
        );
      };

      getProjectId(cwd)
      .then(
        function(projectId) {
          projectInfo.projectId = projectId;
          deferred.resolve(projectId);
        },
        function(error) {
          monaca.getProjectInfo(cwd)
          .then(
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
              projectInfo = info;
              monaca.setProjectId(cwd, info.projectId)
              .then(
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

    findProjectDir(process.cwd())
    .then(
      function(cwd) {
        util.print("Uploading project to Monaca Cloud...");
        assureMonacaProject(cwd)
        .then(
          function() {
            var nbrOfFiles = 0;
            return monaca.uploadProject(cwd)
            .then(
              function() {
                if (nbrOfFiles === 0) {
                  util.print('No files uploaded since project is already in sync.');
                } else {
                  util.print('Project successfully uploaded to Monaca Cloud!');
                }
                return true;
              },
              function(error) {
                util.err('Upload failed: ' + error);
                return false;
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
            Q.reject(error);
          }
        )
        .then(
          function() {
            return monaca.checkBuildAvailability(projectInfo.projectId, params.platform, params.purpose)
            .then(
              function() {
                // Open the browser if no platform parameter is provided.
                if (!argv.platform) {
                  var url = 'https://ide.monaca.mobi/project/' + projectInfo.projectId + '/' + (argv['build-type'] ? 'debugger' : 'build');
                  monaca.getSessionUrl(url)
                  .then(
                    function(url) {
                      open(url);
                    },
                    function(error) {
                      util.err('Unable to open build page.');
                      process.exit(1);
                    }
                  );
                } else {
                  // Build project on Monaca Cloud and download it into ./build folder.
                  util.print("Building project on Monaca Cloud...");
                  monaca.buildProject(projectInfo.projectId, params)
                  .then(function(result) {
                    if (result.binary_url) {
                      return result.binary_url;
                    } else {
                      return Q.reject(result.error_message);
                    }
                  },
                  function(err) {
                    return Q.reject(err);
                  },
                  function(progress) {
                    process.stdout.write(".");
                  })
                  .then(
                    function(url) {
                      monaca.getSessionUrl(url)
                      .then(
                        function(sessionUrl) {
                          var buildPath = "";
                          monaca.download(sessionUrl, {}, function(response) {
                            var filename = "";
                            if (params.output) {
                              buildPath = params.output;
                            } else {
                              if (typeof response.headers['content-disposition'] === 'string') {
                                filename = response.headers['content-disposition'].match(/filename="?([^"]+)"?/)[1];
                              }
                              buildPath = path.join(cwd, "build", filename);
                              shell.mkdir('-p', buildPath.replace(/[^\/]*$/, ''));
                            }
                            return buildPath;
                          })
                          .then(
                            function() {
                              util.print("\nYour package is stored at " + buildPath);
                            },
                            function(err) {
                              util.err("\n" + err);
                            }
                          )
                        },
                        function(error) {
                          util.err(error);
                        }
                      )
                    },
                    function(error) {
                      util.err(error);
                    }
                  )
                }
              },
              function(error) {
                util.err("Unable to build this project. " + error);
              }
            ),
            function(error) {
              util.err('Unable to create monaca project: ' + error);
            }
          }
        ),
        function(err) {
          util.err(err);
        }
      }
    );
  };

  exports.RemoteTask = RemoteTask;
})();
