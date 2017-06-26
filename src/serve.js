(function() {
  'use strict';

  var path = require('path'),
    extend = require('extend'),
    open = require('open'),
    fs = require('fs'),
    Q = require('q'),
    portfinder = require('portfinder'),
    util = require(path.join(__dirname, 'util')),
    Monaca = require('monaca-lib').Monaca,
    argv = require('optimist')
    .alias('p', 'port')
    .default('open', true)
    .argv;

  var ServeTask = {}, monaca;
  var DEFAULT_PORT = 8000

  ServeTask.run = function(taskName, info) {
    monaca = new Monaca(info);

    var report = {
      event: taskName
    };
    monaca.reportAnalytics(report);

    monaca.isCordovaProject(process.cwd())
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
            isTranspileEnabled = monaca.isTranspileEnabled(process.cwd());

          if (isTranspileEnabled) {
            util.checkNodeRequirement();
          }

          // Make sure the logs only appear at the end of the process.
          var hookStdout = function() {
            var originalWrite = process.stdout.write;

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
            var webpack, webpackConfig, modulesPath, server;

            if(monaca.isEjected(process.cwd())){
              modulesPath = process.cwd();
            } else {
              process.env.MODULES_PATH = '.cordova';
              modulesPath = monaca.userCordova;
            }

            var WebpackDevServer = require(path.join(modulesPath, 'node_modules', 'webpack-dev-server'));

            if(monaca.getWebpackVersion(process.cwd()) === 2) {
              process.env.NODE_ENV = 'development';
              webpack = require(path.join(modulesPath, 'node_modules', 'webpack'));

              if(monaca.isEjected(process.cwd())) {
                webpackConfig = require(path.join(process.cwd(), 'webpack.config.js'));
              } else {
                webpackConfig = require(monaca.getWebpack2ConfigFile(process.cwd()));
              }
            } else {
              if (monaca.isEjected(process.cwd())) {
                webpack = require(path.join(modulesPath, 'node_modules', 'webpack'));
                webpackConfig = require(monaca.getWebpackConfigFile(process.cwd(), 'dev'));
              } else {
                var errorMessage = 'This version of webpack can be used only with dependencies stored locally.\n' +
                                   'Please use monaca eject command in order to continue.\n'+
                                   'You can find more information at migration guide';
                throw new Error(errorMessage);
              }
            }

            server = new WebpackDevServer(webpack(webpackConfig), webpackConfig.devServer);
            server.listen(port, '0.0.0.0', hookStdout);
          } else {

            var server = require("live-server");

            var params = {
              port: port,
              host: "0.0.0.0",
              root: path.join(process.cwd(), 'www'),
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
