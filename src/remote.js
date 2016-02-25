(function() {
  'use strict';

  var path = require('path'),
    open = require('open'),
    argv = require('optimist').argv,
    shell = require('shelljs'),
    Monaca = require('monaca-lib').Monaca,
    Q = require(path.join(__dirname, 'qustom')),
    util = require(path.join(__dirname, 'util'));

  var monaca = new Monaca();

  var RemoteTask = {};

  RemoteTask.run = function(taskName) {
    monaca.relogin().then(
      function() {
        var task = argv._[1];

        if (task === 'build') {
          this.build();
        } else {
          util.err('No such command.');
          process.exit(1);
        }
      }.bind(this),
      function() {
        util.err('Must be signed in to use this command.');
        util.print('Please sign in with \'monaca login\'.');
        util.print('If you don\'t have an account yet you can create one at https://monaca.mobi/en/register/start');
        process.exit(1);
      }
    );
  };

  RemoteTask.build = function() {
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

    var projectInfo = {};
    var assureMonacaProject = function(cwd) {
      var deferred = Q.defer();
      var getProjectId = function(projectDir) {
        return monaca.getProjectId(projectDir).then(
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

    findProjectDir(process.cwd())
      .then(
        function(cwd) {
          util.print('Uploading project to Monaca Cloud...');
          assureMonacaProject(cwd)
            .then(
              function() {
                var nbrOfFiles = 0;
                return monaca.uploadProject(cwd).then(
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
                // Open the browser if no platform parameter is provided.
                if (!argv.platform) {
                  var url = 'https://ide.monaca.mobi/project/' + projectInfo.projectId + '/' + (argv['build-type'] ? 'debugger' : 'build');
                  monaca.getSessionUrl(url).then(
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
                  util.print('Building project on Monaca Cloud...');
                  monaca.buildProject(projectInfo.projectId, params)
                    .then(
                      function(result) {
                        if (result.binary_url) {
                          return result.binary_url;
                        } else {
                          return Q.reject(result.error_message);
                        }
                      },
                      function(error) {
                        return Q.reject(error);
                      },
                      function(progress) {
                        util.print(progress);
                      })
                    .then(
                      function(url) {
                        monaca.getSessionUrl(url).then(
                          function(sessionUrl) {
                            var buildDir = '';
                            shell.mkdir('-p', path.join(cwd, 'build'));
                            monaca.download(sessionUrl, {}, function(response) {
                              var filename = '';
                              if (typeof response.headers['content-disposition'] === 'string') {
                                filename = response.headers['content-disposition'].match(/filename="?([^"]+)"?/)[1];
                              }
                              buildDir = path.join(cwd, 'build', filename);
                              return buildDir;
                            }).then(
                              function(name) {
                                util.print('Your package is stored at ' + buildDir);
                              },
                              function(error) {
                                util.err(error);
                              }
                            );
                          },
                          function(error) {
                            util.err(error);
                          }
                        );
                      },
                      function(error) {
                        util.err(error);
                      }
                    );
                }
              },
              function(error) {
                util.err('Unable to build this project ' + error);
              }
            );
        },
        function(error) {
          util.err(error);
        }
      );
  };

  module.exports = RemoteTask;
})();
