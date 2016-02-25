(function() {
  'use strict';

  var path = require('path'),
    exec = require('child_process').exec,
    fs = require('fs'),
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

    var assureHttpServer = function(httpServerBin) {
      var deferred = Q.defer();

      fs.exists(httpServerBin, function(exists) {
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
        deferred.resolve(assureHttpServer(path.join(__dirname, 'serve', 'node_modules', '.bin', 'http-server')));
      }
    });

    return deferred.promise;
  };

  ServeTask.run = function(taskName) {
    this.assureCordovaProject(process.cwd()).then(
      function() {
        var fixLog = function(data) {
          return data.toString()
            .split('\n')
            .filter(function(item) {
              return item !== '';
            })
            .map(function(item) {
              return item + '\n';
            });
        };

        var port = process.argv.length >= 4 ? process.argv[3] : 8000;

        var processes = [{
          name: 'Cordova',
          process: exec(path.join(__dirname, '..', 'node_modules', '.bin', 'cordova') + ' ' + process.argv.slice(2).join(' ')),
          color: 'yellow'
        }, {
          name: 'http-server',
          process: exec(path.join(__dirname, 'serve', 'node_modules', '.bin', 'http-server') + ' ' + path.join(process.cwd(), 'www') + ' -c-1 -o -p ' + port, {cwd: __dirname}),
          color: 'cyan'
        }];

        var stopProcesses = function() {
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
