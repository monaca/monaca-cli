(function() {
  'use strict';

  var path = require('path'),
    exec = require('child_process').exec,
    fs = require('fs'),
    shell = require('shelljs'),
    Q = require(path.join(__dirname, 'qustom')),
    util = require(path.join(__dirname, 'util'));

  var ServeTask = {};

  /*
   * Checks that directory contains www.
   * If it does it will copy package.json and gulpfile.js from the templates folder
   * if needed.
   */
  ServeTask.assureCordovaProject = function(projectPath) {
    var deferred = Q.defer();

    var assureInstallation = function(nodeModules) {
      var deferred = Q.defer();

      fs.exists(nodeModules, function(exists) {
        if (exists) {
          deferred.resolve();
        } else {
          util.print('Installing packages. Please wait. This might take a couple of minutes.');

          var process = exec('npm install --loglevel error', {cwd: path.join(__dirname, 'serve')});

          process.stdout.on('data', function(data) {
            util.print(data);
          });

          process.stderr.on('data', function(data) {
            util.err(data);
          });

          process.on('exit', function(code) {
            if (code === 0) {
              deferred.resolve();
            } else {
              deferred.reject('Failed installing packages.');
            }
          });
        }
      });

      return deferred.promise;
    };

    fs.exists(path.join(projectPath, 'www'), function(exists) {
      if (!exists) {
        deferred.reject('Directory doesn\'t contain a www/ folder.');
      } else {
        deferred.resolve(assureInstallation(path.join(__dirname, 'serve', 'node_modules')));
      }
    });

    return deferred.promise;
  };

  ServeTask.run = function(taskName) {
    this.assureCordovaProject(process.cwd()).then(
      function() {
        var fixLog = function(data) {
            var ret = data.toString()
              .split('\n')
              .filter(function(item) {
                return item !== '';
              })
              .map(function(item) {
                return item + '\n';
              });

            return ret;
          },
          processes = [{
            name: 'Cordova',
            process: exec(path.join(__dirname, '..', 'node_modules', '.bin', 'cordova') + ' ' + process.argv.slice(2).join(' ')),
            color: 'yellow'
          }, {
            name: 'gulp',
            process: exec(path.join(__dirname, 'serve', 'node_modules', '.bin', 'gulp') + ' serve --dirname ' + process.cwd(), {cwd: path.join(__dirname, 'serve')}),
            color: 'cyan'
          }],
          stopProcesses = function() {
            processes.forEach(function(item) {
              item.process.kill();
            });
          };

        processes.forEach(function(item) {
          item.process.stdout.on('data', function(data) {
            fixLog(data).forEach(function(log) {
              process.stdout.write((item.name + ': ').bold[item.color] + log.info);
            });
          });

          item.process.stderr.on('data', function(data) {
            fixLog(data).forEach(function(log) {
              process.stderr.write((item.name + ': ').bold[item.color] + log.error);
            });
          });

          item.process.on('exit', function(code) {
            if (code !== 0) {
              stopProcesses();
              process.exit(code);
            }
          });
        });
      },
      function(error) {
        util.err('Failed serving project: ' + error);
        process.exit(1);
      }
    );
  };

  module.exports = ServeTask;
})();
