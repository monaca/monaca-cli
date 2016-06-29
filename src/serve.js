(function() {
'use strict';

var path = require('path'),
  exec = require('child_process').exec,
  fs = require('fs'),
  Q = require('q'),
  util = require(path.join(__dirname, 'util')),
  Monaca = require('monaca-lib').Monaca,
  argv = require('optimist')
    .alias('p', 'port')
    .default('open', true)
    .argv;

var ServeTask = {};
var monaca = new Monaca();

/*
 * Checks that directory contains www.
 * If it does it will copy package.json and gulpfile.js from the templates folder
 * if needed.
 */
ServeTask.assureCordovaProject = function(projectPath) {
  var deferred = Q.defer();

  fs.exists(path.join(projectPath, 'www'), function(exists) {
    if (!exists) {
      deferred.reject('Directory doesn\'t contain a www/ folder.');
    } else {
      var httpServerBin = path.join(__dirname, 'serve', 'node_modules', '.bin', 'http-server');

      fs.exists(httpServerBin, function(exists) {
        if (exists) {
          deferred.resolve();
        } else {
          util.print('Installing packages. Please wait. This might take a couple of minutes.\n');

          var npmProcess = exec('npm install --loglevel error', {
            cwd: path.join(__dirname, 'serve')
          });

          npmProcess.stdout.on('data', util.print);
          npmProcess.stderr.on('data', util.err);
          npmProcess.on('exit', function(code) {
            code === 0 ? deferred.resolve() : deferred.reject('Failed installing packages.');
          });
        }
      });
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

        var processes = [];
        var bin;
        if (monaca.requireTranspile(process.cwd())) {
          // Webpack Route
          bin = monaca.getWebpackDevServerBinPath();

          processes.push({
            name: 'webpack-dev-server',
            process: exec('node' + ' ' + bin + ' --progress --config ' + path.join(process.cwd(), 'webpack.dev.config.js') +  (argv.port ? ' --port ' + argv.port : '')),
            color: 'cyan',
            alive: true
          });

        } else {
          // HTTP Server Route
          bin = path.join(__dirname, 'serve', 'node_modules', 'http-server', 'bin', 'http-server');


          processes.push({
            name: 'http-server',
            process: exec('node' + ' ' + bin + ' ' + path.join(process.cwd(), 'www') + ' -c-1 ' + (argv.open ? ' -o ' : '') + ' -p ' + (argv.port || 8000), {
              cwd: __dirname
            }),
            color: 'cyan',
            alive: true
          });
        }

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
            item.alive = false;

            var shouldKeepRunning = false;
            processes.forEach(function(i) {
              if (i.alive) {
                shouldKeepRuninng = true;
              }
            });

            if (!shouldKeepRunning) {
              fileWatcherTranspiler.stop();
            }

            if (code !== 0) {
              stopProcesses();
              process.exit(code);
            }
          });
        });
      },
      util.fail.bind(null, 'Failed serving project: ')
    );
  };

  module.exports = ServeTask;
})();