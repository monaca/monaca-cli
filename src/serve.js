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

  ServeTask.run = function(taskName, info) {
    monaca = new Monaca(info);

    var report = {
      event: 'preview'
    };
    monaca.reportAnalytics(report);

    monaca.isCordovaProject(process.cwd())
      .then(
        function() {
          // ifaces
          var deferredAddresses = Q.defer();
          require('dns').lookup(require('os').hostname(), { family: 4, all: true } , function(err, addresses) {
            if (err) {
              util.warn(err);
            }
            deferredAddresses.resolve(addresses || []);
          });

          // port
          var deferredPort = Q.defer();
          portfinder.basePort = argv.port || 8000;
          portfinder.getPort(function(err, port) {
            if (err) {
              return deferredPort.reject(err);
            }
            if (argv.port && argv.port !== port) {
              util.warn('The specified port ' + argv.port + ' is already in use. Using available port ' + port + ' instead.\n');
            }
            deferredPort.resolve(port);
          });

          return Q.all([deferredAddresses.promise, deferredPort.promise]);
        }
      )
      .then(
        function(info) {
          var ifaces = info[0], port = info[1];
          var isTranspileEnabled = monaca.isTranspileEnabled(process.cwd());

          // Log information about IP addresses and opens browser if requested.
          var logAndOpen = function() {
            var canonicalHost = '127.0.0.1';
            var address = 'http://' + canonicalHost + ':' + port
              + (isTranspileEnabled ? '/webpack-dev-server/' : '');

            process.stdout.write('HTTP server available on:'.yellow);
            process.stdout.write('\n  ' + address.green);

            ifaces.forEach(function(iface) {
              process.stdout.write('\n  ' + address.replace(canonicalHost, iface.address).green);
            });

            process.stdout.write('\nHit CTRL-C to stop the server\n\n');

            if (argv.open) {
              open(address);
            }
          };

          // Make sure the logs only appear at the end of the process.
          var hookStdout = function() {
            var originalWrite = process.stdout.write

            process.stdout.write = function(string) {
              originalWrite.apply(process.stdout, arguments)
              if (/bundle is now VALID/.test(string)) {
                process.stdout.write = originalWrite;
                process.stdout.write('\n');
                logAndOpen();
              }
            };
          };


          if (isTranspileEnabled) {

            // Webpack Dev Server
            var webpack = require(path.join(monaca.userCordova, 'node_modules', 'webpack'));
            var webpackConfig = require(monaca.getWebpackConfigFile(process.cwd(), 'dev'));
            var WebpackDevServer = require(path.join(monaca.userCordova, 'node_modules', 'webpack-dev-server'));

            var server = new WebpackDevServer(webpack(webpackConfig), webpackConfig.devServer);

            server.listen(port, '0.0.0.0', hookStdout);

          } else {

            // HTTP Server
            var httpServer = require('http-server');

            var server = httpServer.createServer({
              root: path.join(process.cwd(), 'www'),
              cache: -1,
              logFn: function (req, res, error) {
                if (error) {
                  console.log(
                    '[%s] "%s %s" Error (%s): "%s"',
                    new Date(), req.method.red, req.url.red,
                    error.status.toString().red, error.message.red
                  );
                }
              }
            });

            server.listen(port, '0.0.0.0', logAndOpen);
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
    .catch(util.fail.bind(null, 'Failed serving project: '));
  };

  module.exports = ServeTask;
})();
