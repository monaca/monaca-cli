(function() {
'use strict';

var path = require('path'),
  open = require('open'),
  argv = require('optimist').argv,
  shell = require('shelljs'),
  Monaca = require('monaca-lib').Monaca,
  Q = require('q'),
  lib = require(path.join(__dirname, 'lib')),
  util = require(path.join(__dirname, 'util'));

var RemoteTask = {}, monaca;

RemoteTask.run = function(taskName, info) {
  monaca = new Monaca(info);

  monaca.prepareSession().then(
    function() {
      var task = argv._[1];

      if (task === 'build') {
        this.build();
      } else {
        util.fail('No such command.');
      }
    }.bind(this),
    util.displayLoginErrors
  );
};

RemoteTask.build = function() {

  var params = {};
  params.platform = argv._[2];
  params.purpose = argv['build-type'] || 'debug';

  ['browser', 'android_webview', 'android_arch', 'output']
  .forEach(function(property) {
    if (argv.hasOwnProperty(property)) {
      params[property] = argv[property];
    }
  });

  if (!params.browser && (!params.platform || !params.purpose)) {
    util.fail('Missing parameters. Please write --help to see the correct usage.');
  }

  var report = {
    event: 'remote-build',
    arg1: params.platform,
    otherArgs: JSON.stringify(params)
  };
  monaca.reportAnalytics(report);

  var cwd, projectInfo, error = '';

  lib.confirmOverwrite({action: 'upload'})
    // Waiting for user permission.
    .then(
      function() {
        return lib.findProjectDir(process.cwd(), monaca);
      }
    )
    // Checking project directory.
    .then(
      function(directory) {
        cwd = directory;
        util.print('Uploading project to Monaca Cloud...');
        error = 'Unable to create monaca project: ';
        return lib.assureMonacaProject(cwd, monaca);
      }
    )
    // Assuring this is a Monaca-like project.
    .then(
      function(info) {
        projectInfo = info;
        error = 'Upload failed: ';
        return monaca.uploadProject(cwd)
          .progress(util.displayProgress);
      }
    )
    // Uploading project to Monaca Cloud.
    .then(
      function(files) {
        lib.printSuccessMessage({action: 'upload'}, files);
        if (!params.browser) {
          error = 'Unable to build this project: ';
          return monaca.checkBuildAvailability(projectInfo.projectId, params.platform, params.purpose);
        }
      }
    )
    // Checking build availabilty (if no browser).
    .then(
      function() {
        if (argv.browser) {
          var url = 'https://ide.monaca.mobi/project/' + projectInfo.projectId + '/' + (argv['debugger'] ? 'debugger' : 'build');
          return monaca.getSessionUrl(url)
            .then(
              function(url) {
                var deferred = Q.defer();
                open(url, function(error) {
                  if (error) {
                    return deferred.reject(error);
                  }
                  deferred.resolve();
                });
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
    // Getting session URL.
    .then(
      function(sessionUrl) {
        return monaca.download(sessionUrl, {}, function(response) {
          if (params.output) {
            return path.resolve(params.output);
          }

          var filename = 'output.bin';
          if (typeof response.headers['content-disposition'] === 'string') {
            var regexMatch = response.headers['content-disposition'].match(/filename="?([^"]+)"?/);
            if (regexMatch) {
              filename = regexMatch[1];
            }
          }

          shell.mkdir('-p', path.join(cwd, 'build'));
          return path.join(cwd, 'build', filename);
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
};

module.exports = RemoteTask;
})();
