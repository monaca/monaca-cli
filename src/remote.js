(function() {
'use strict';

var path = require('path'),
  open = require('opn'),
  argv = minimist(process.argv.slice(2)),
  shell = require('shelljs'),
  Monaca = require('monaca-lib').Monaca,
  Q = require('q'),
  inquirer = require('inquirer'),
  lib = require(path.join(__dirname, 'lib')),
  util = require(path.join(__dirname, 'util'));

var RemoteTask = {}, monaca;

const skipUpload = argv.skipUpload || false;

RemoteTask.run = function(taskName, info) {
  monaca = new Monaca(info);

  monaca.prepareSession().then(
    function() {
      var task = argv._[1];

      if (task === 'build' || task === 'config') {
        this.remote(task);
      } else {
        util.fail('No such command.');
      }
    }.bind(this),
    util.displayLoginErrors
  );
};

// Perform remote operations: build | config
RemoteTask.remote = function(task) {

  var params = {};
  params.platform = argv._[2];
  params.purpose = argv['build-type'] || 'debug';

  ['browser', 'build-list', 'android_webview', 'android_arch', 'output']
  .forEach(function(property) {
    if (argv.hasOwnProperty(property)) {
      params[property] = argv[property];
    }
  });

  if (!params.browser && !params['build-list'] && task !== 'config' && (!params.platform || !params.purpose)) {
    util.fail('Missing parameters. Please write --help to see the correct usage.');
  }

  var report = {
    event: 'remote-' + task,
    arg1: params.platform,
    otherArgs: JSON.stringify(params)
  };
  monaca.reportAnalytics(report);

  var cwd, projectInfo, error = '';

  lib.findProjectDir(process.cwd(), monaca)
    // Waiting for user permission.
    .then(
      function(projectDir) {
        cwd = projectDir;

        if (skipUpload) {
          return true;
        } else if (!params['build-list']) {
         return lib.confirmOverwrite({action: 'upload'});
       }
      }
    )
    // Checking project directory.
    .then(
      function() {
        if (!params['build-list']) {
          error = 'Unable to create monaca project: ';
        }
        return lib.assureMonacaProject(cwd, monaca);
      }
    )
    // Assuring this is a Monaca-like project.
    .then( 
      (info) => {
        projectInfo = info;
        lib.needToUpgrade(cwd, monaca);

        let options = {};
        options.showSpinner = true;
        options.skipTranspile = argv.skipTranspile || false;

        error = 'Upload failed: ';

        if (skipUpload) {
          util.warn('\nSkip uploading local changes to the cloud.');
          return null;
        } else if (!params['build-list']) {
          util.print('Uploading project to Monaca Cloud...');
          if (options.skipTranspile) util.warn('\nSkip transpile process.');
          return monaca.uploadProject(cwd, options)
            .progress(util.displayProgress);
        }
      }
    )
    // Uploading project to Monaca Cloud.
    .then(
      function(files) {
        if (!params.browser && task !== 'config' &&  !params['build-list']) {
          lib.printSuccessMessage({action: 'upload'}, files);
          error = 'Unable to build this project: ';
          return monaca.checkBuildAvailability(projectInfo, params);
        }
      }
    )
    // Checking build availabilty (if no browser).
    .then(
      function() {
        if (argv.browser || task === 'config') {
          var url = monaca.apiRoot.match(/https(.*)\//)[0] + '/project/' + projectInfo.projectId + '/' + (argv['debugger'] ? 'debugger' : 'build');
          return monaca.getSessionUrl(url)
            .then(
              function(url) {
                var deferred = Q.defer();
                open(url, {wait: false})
                .then(() => {
                  if (task === 'config') {
                    util.warn('\nOnce the Cloud configuration has been saved, run `monaca download --delete` to get the changes locally.');
                  }
                  deferred.resolve();
                })
                .catch(error => {
                  if (error) {
                    return deferred.reject(error);
                  }
                }) ;
                return deferred.promise;
              }
            )
            .then(
              monaca.reportFinish.bind(monaca, report),
              monaca.reportFail.bind(monaca, report)
            )
            .then(
              process.exit.bind(process, 1),
              util.fail.bind(null, 'Unable to open build page: ')
            );
        } else if (argv['build-list']) {
          // Display all the available builds and request which one to download.
          util.success('\nChecking available builds..\n');
          return monaca.getRemoteBuildList(projectInfo.projectId)
          .then(
            function(result) {
              var body = JSON.parse(result.body);

              if (body.status === 'ok') {
                return checkValidBuilds(body)
                .then(
                  function(validBuilds) {
                    util.print('');
                    return requestBuildSelection(validBuilds);
                  }
                )
              } else {
                return Q.reject(body.status);
              }
            }
          )
        } else {
          // Build project on Monaca Cloud and download it into ./build folder.
          util.print('\nBuilding project on Monaca Cloud...');
          error = 'Remote build failed:  ';
          return monaca.buildProject(projectInfo.projectId, params)
            .progress(util.displayProgress);
        }
      }
    )
    // Building the project remotely.
    .then(
      function(result) {
        return result.binary_url ? monaca.getSessionUrl(result.binary_url) : Q.reject(result.error_message);
      }
    )
    // Getting session URL && Preparing the file path
    .then(
      function(sessionUrl) {
        // return the filepath if it is specified
        if (params.output) {
          return Q.resolve({
            sessionUrl: sessionUrl,
            buildDir: params.output
          });
        } else {
          return specifyBuildDirectory(sessionUrl);
        }
      }
    )
    // Download file
    .then(
      function(result) {
        let sessionUrl = result.sessionUrl;
        let buildDir = result.buildDir;
        return monaca.download(sessionUrl, {}, function(response) {
          if (params.output) {
            return path.resolve(params.output); //filepath specified by --path
          }

          var filename = '';

          if (!response || !response.headers['content-disposition']) {
            util.fail("Unfortunately, it appears that your download has expired.\nWe kindly request that you run `monaca remote build --build-list` in order to obtain a list of all remote builds.");
          }

          if (typeof response.headers['content-disposition'] === 'string') {
            var regexMatch = response.headers['content-disposition'].match(/filename="?([^"]+)"?/);
            if (regexMatch) {
              filename = regexMatch[1];
            }
          }

          // generate default filename if filename from backend is null
          if (!filename) {
            try {
              if (params.platform === 'android') {
                filename = 'app.apk';
              } else if (params.platform === 'ios') {
                filename = 'app.ipa';
              } else if (params.platform && params.platform.includes('electron')) {
                filename = 'app.zip';
              } else {
                filename = 'output.zip';
              }
            } catch (error) {
              filename = 'output.zip';
            }
          }

          shell.mkdir('-p', buildDir);
          return path.join(buildDir, filename);
        });
      }
    )
    .then(
      monaca.reportFinish.bind(monaca, report),
      monaca.reportFail.bind(monaca, report)
    )
    // Downloading binary file from Monaca Cloud.
    .then(
      function(filepath) {
        util.success('\n\nYour package is stored at ' + filepath);
      },
      util.fail
    );

  var specifyBuildDirectory = function(sessionUrl) {
    let deferred = Q.defer();

    // get the build directory from user
    let default_path = path.join( process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'], 'Desktop');
    util.print(''); //insert an empty line
    inquirer.prompt({
      type: 'input',
      name: 'build_path',
      message: 'Please enter the directory to save the file or press Enter to accept the default:',
      default: default_path
    })
    .then(
      function(response) {
        if (response && response.build_path) {
          return deferred.resolve({
            sessionUrl: sessionUrl,
            buildDir: response.build_path
          });
        }
      }
    );

    return deferred.promise;
  };

  var requestBuildSelection = function(validBuilds) {
    var deferred = Q.defer();

    inquirer.prompt({
      type: 'input',
      name: 'build',
      message: 'Please enter the build number you want to download or [q] to exit:'
    })
    .then(
      function(response) {
        if (/^q$/i.test(response.build)) {
          return deferred.reject('Cancel');
        } else if (response.build > 0 && response.build <= validBuilds.length) {
          var result = {};
          result['binary_url'] = 'https://ide.monaca.mobi/install/package/' + projectInfo.projectId + '/' + validBuilds[response.build - 1].id;
          util.print('\nDownloading the requested build...');
          deferred.resolve(result);
        } else {
          return deferred.reject('Could not find the requested build.');
        }
      }
    );

    return deferred.promise;
  };

  var checkValidBuilds = function(body) {
    var validBuilds = [],
      allAndroidBuilds = body.result.android.items,
      allIosBuilds = body.result.ios.items,
      allPwaBuilds = body.result.pwa.items,
      allElectronWindowsBuilds = body.result.electron_windows.items,
      allElectronMacOSBuilds = body.result.electron_macos.items,
      allElectronLinuxBuilds = body.result.electron_linux.items,
      index = 1;

    // android builds
    for (var build in allAndroidBuilds) {
      var currentBuild = allAndroidBuilds[build];
      if (currentBuild.status === 'finish' && currentBuild['is_download_active']) {
        validBuilds.push(currentBuild);
        util.print(index.toString().green.bold + ' | Android ' + currentBuild.type + ' build created at ' + currentBuild['created_text'] + ', expires at ' + currentBuild['download_expire_text']);
        index++;
      }
    }

    // ios builds
    for (var build in allIosBuilds) {
      var currentBuild = allIosBuilds[build];
      if (currentBuild.status === 'finish' && currentBuild['is_download_active']) {
        validBuilds.push(currentBuild);
        util.print(index.toString().green.bold + ' | iOS ' + currentBuild.type + ' build created at ' + currentBuild['created_text'] + ', expires at ' + currentBuild['download_expire_text']);
        index++;
      }
    }

    // pwa builds
    for (var build in allPwaBuilds) {
      var currentBuild = allPwaBuilds[build];
      if (currentBuild.status === 'finish' && currentBuild['is_download_active']) {
        validBuilds.push(currentBuild);
        util.print(index.toString().green.bold + ' | PWA ' + currentBuild.type + ' build created at ' + currentBuild['created_text'] + ', expires at ' + currentBuild['download_expire_text']);
        index++;
      }
    }

    // All electron builds
    // Windows
    for (var build in allElectronWindowsBuilds) {
      var currentBuild = allElectronWindowsBuilds[build];
      if (currentBuild.status === 'finish' && currentBuild['is_download_active']) {
        validBuilds.push(currentBuild);
        util.print(index.toString().green.bold + ' | Windows ' + currentBuild.type + ' build created at ' + currentBuild['created_text'] + ', expires at ' + currentBuild['download_expire_text']);
        index++;
      }
    }
    // Mac
    for (var build in allElectronMacOSBuilds) {
      var currentBuild = allElectronMacOSBuilds[build];
      if (currentBuild.status === 'finish' && currentBuild['is_download_active']) {
        validBuilds.push(currentBuild);
        util.print(index.toString().green.bold + ' | Mac ' + currentBuild.type + ' build created at ' + currentBuild['created_text'] + ', expires at ' + currentBuild['download_expire_text']);
        index++;
      }
    }
    // Linux
    for (var build in allElectronLinuxBuilds) {
      var currentBuild = allElectronLinuxBuilds[build];
      if (currentBuild.status === 'finish' && currentBuild['is_download_active']) {
        validBuilds.push(currentBuild);
        util.print(index.toString().green.bold + ' | Linux ' + currentBuild.type + ' build created at ' + currentBuild['created_text'] + ', expires at ' + currentBuild['download_expire_text']);
        index++;
      }
    }

    if (validBuilds.length === 0) {
      return Q.reject('No builds available. Run `monaca remote build --help` to learn how to generate one.');
    }

    return Q.resolve(validBuilds);
  }
};

module.exports = RemoteTask;
})();
