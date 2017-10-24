(function() {
  'use strict';

  var path = require('path'),
    extend = require('extend'),
    open = require('open'),
    fs = require('fs'),
    Q = require('q'),
    portfinder = require('portfinder'),
    exec = require('child_process').exec,
    util = require(path.join(__dirname, 'util')),
    lib = require(path.join(__dirname, 'lib')),
    Monaca = require('monaca-lib').Monaca,
    argv = require('optimist')
    .alias('p', 'port')
    .default('open', true)
    .argv;

  var ServeTask = {}, monaca;
  var DEFAULT_PORT = 8000;

  ServeTask.run = function(taskName, info) {
    monaca = new Monaca(info);

    lib.findProjectDir(process.cwd(), monaca)
    .then(
      function(dir) {
        var projectDir = dir,
          projectConfig;

        try {
          projectConfig = require(path.join(projectDir, 'package.json'));
        } catch (err) {
          return serveProject(taskName, projectDir);
        }

        if (taskName !== 'demo' && projectConfig && projectConfig.scripts && projectConfig.scripts.dev) {
          var childProcess = exec('npm run dev');

          childProcess.stdout.on('data', function(data) {
            process.stdout.write(data.toString());
          });

          childProcess.stderr.on('data', function(data) {
            if (data) {
              process.stderr.write(data.toString().error);
            }
          });
        } else {
          return serveProject(taskName, projectDir);
        }
      }
    )
    .catch(util.fail.bind(null, 'Project ' + taskName + ' failed: '));
  };

  var serveProject = function(taskName, projectDir) {
    var report = {
      event: taskName
    };
    monaca.reportAnalytics(report);

    monaca.isCordovaProject(projectDir, monaca)
      .then(
        function() {

          var checkPort = function() {
            var deferredPort = Q.defer();
            portfinder.basePort = argv.port || DEFAULT_PORT;
            portfinder.getPort(function(err, port) {
              if (err) {
                return deferredPort.reject(err);
              }
              if (argv.port && argv.port !== port) {
                util.warn('The specified port ' + argv.port + ' is already in use. Using available port ' + port + ' instead.\n');
              }
              deferredPort.resolve(port);
            });
            return deferredPort.promise;
          }

          return checkPort();
        }
      )
      .then(
        function(port) {
          var port = port,
            isTranspileEnabled = monaca.isTranspileEnabled(projectDir);

          if (isTranspileEnabled) {
            util.checkNodeRequirement();
          }

          // Make sure the logs only appear at the end of the process.
          var hookStdout = function() {
            var originalWrite = process.stdout.write

            process.stdout.write = function(string) {
              originalWrite.apply(process.stdout, arguments)
              if (/bundle is now VALID|webpack: Compiled successfully/.test(string)) {
                process.stdout.write = originalWrite;
                process.stdout.write('\n');
                if (taskName == 'demo') {
                  open('http://127.0.0.1:' + port + '/monaca-demo/');
                } else {
                  open('http://127.0.0.1:' + port + '/webpack-dev-server/');
                }
              }
            };
          };

          if (isTranspileEnabled) {

            // Webpack Dev Server
            var webpack = require(path.join(monaca.userCordova, 'node_modules', 'webpack'));
            var webpackConfig = require(monaca.getWebpackConfigFile(projectDir, 'dev'));

            if (webpackConfig.devServer.inline) {
              if (webpackConfig.entry.app && webpackConfig.entry.app instanceof Array) {
                webpackConfig.entry.app.unshift("webpack-dev-server/client?http://localhost:" + port + "/");
              } else if (webpackConfig.entry && webpackConfig.entry instanceof Array) {
                webpackConfig.entry.unshift("webpack-dev-server/client?http://localhost:" + port + "/");
              }
            }

            var WebpackDevServer = require(path.join(monaca.userCordova, 'node_modules', 'webpack-dev-server'));
            var server = new WebpackDevServer(webpack(webpackConfig), webpackConfig.devServer);

            server.listen(port, '0.0.0.0', hookStdout);

          } else {

            var server = require("live-server");

            var params = {
              port: port,
              host: "0.0.0.0",
              root: path.join(projectDir, 'www'),
              open: (taskName === 'demo') ? false : true,
              mount: [['/monaca-demo', path.resolve(__dirname, '..', 'pages', 'demo')]],
              logLevel: 3
            }

            server.start(params);

            if (taskName == 'demo') {
              open('http://127.0.0.1:' + port + '/monaca-demo/');
            }
          }

          if (process.platform === 'win32') {
            require('readline').createInterface({
              input: process.stdin,
              output: process.stdout
            }).on('SIGINT', function() {
              process.emit('SIGINT')
            });
          }

          var exitProcess = function() {
            process.stdout.write('\nStopping http server...\n'.red);
            process.exit();
          };
          process.on('SIGINT', exitProcess);
          process.on('SIGTERM', exitProcess);
        }
      )
    .catch(monaca.reportFail.bind(monaca, report))
    .catch(util.fail.bind(null, 'Project ' + taskName + ' failed: '));
  };

  module.exports = ServeTask;
})();
