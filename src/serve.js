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

  var ServeTask = {}, monaca;

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

  ServeTask.run = function(taskName, info) {
    monaca = new Monaca(info);

    var report = {
      event: 'preview'
    };
    monaca.reportAnalytics(report);

    this.assureCordovaProject(process.cwd())
      .then(
        function() {
          var deferred = Q.defer();
          require('dns').lookup(require('os').hostname(), 4, function(err, address) {
            deferred.resolve(address || '127.0.0.1');
          });
          return deferred.promise;
        }
      )
      .then(
        function(host) {

          var childProcessBin, childProcess;

          var isTranspileEnabled = monaca.isTranspileEnabled(process.cwd());

          if (isTranspileEnabled) {
            // Webpack Route
            childProcessBin = monaca.getWebpackDevServerBinPath();
            childProcess = exec(childProcessBin + (argv.open ? ' --open' : '') + ' --progress --config ' + path.join(process.cwd(), 'webpack.dev.config.js'), {
              env: {
                WP_HOST: host,
                WP_PORT: argv.port
              }
            });
          } else {
            // HTTP Server Route
            childProcessBin = path.join(__dirname, 'serve', 'node_modules', 'http-server', 'bin', 'http-server');
            childProcess = exec('node' + ' ' + childProcessBin + ' ' + path.join(process.cwd(), 'www') + ' -c-1 ' + (argv.open ? ' -o ' : '') + ' -p ' + (argv.port || 8000));
          }

          childProcess.stdout.on('data', function(data) {
            var message = data.toString();
            if (isTranspileEnabled || !/^\[.+?\]\s+".+?"\s+"/.test(message)) {
              if (message.startsWith('http://')) {
                process.stdout.write('\n');
              }
              process.stdout.write(message.info);

              if (/bundle is now VALID/.test(message)) {
                process.stderr.write('\nHTTP server available on:'.verbose);
                var address = '\n  http://localhost:' + (argv.port || 8000) + '/webpack-dev-server/'
                process.stderr.write(address.replace('localhost', host).info);
                process.stderr.write(address.replace('localhost', '127.0.0.1').info);
                process.stderr.write('\nHit CTRL-C to stop the server\n');
              }
            }
          });

          childProcess.stderr.on('data', function(data) {
            process.stderr.write(data.toString().error);
          });

          childProcess.on('exit', function(code) {
            if (code !== 0) {
              childProcess.kill();
              process.exit(code);
            }
          });

          if (process.platform === 'win32') {
            var rl = require('readline').createInterface({
              input: process.stdin,
              output: process.stdout
            });

            rl.on('SIGINT', function() {
              util.print('\nStopping http server...'.info);
              exec('taskkill /pid ' + process.pid + ' /T /F');
            });
          }
        },
        monaca.reportFail.bind(monaca)
      )
    .catch(util.fail.bind(null, 'Failed serving project: '));
  };

  module.exports = ServeTask;
})();
