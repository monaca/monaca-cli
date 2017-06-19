(function() {
  'use strict';

  var path = require('path'),
    extend = require('extend'),
    open = require('open'),
    fs = require('fs'),
    Q = require('q'),
    util = require(path.join(__dirname, 'util')),
    Monaca = require('monaca-lib').Monaca,
    argv = require('optimist')
    .alias('p', 'port')
    .default('open', true)
    .argv;

  var ServeTask = {}, monaca;
  var DEFAULT_DEMO_PORT = 8200,
    DEFAULT_CONTENT_PORT = 8550,
    DEFAULT_PREVIEW_PORT = 8000;

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

          var checkPort = function(port, strict) {
            //clear cach to distinguish multiple istances of portfinder
            delete require.cache[require.resolve('portfinder')];

            var deferred = Q.defer();
            var portfinder = require('portfinder');

            portfinder.basePort = port;
            portfinder.getPort(function(err, freePort) {
              if (err) {
                deferred.reject(err);
              } else {
                if (port && port !== freePort) {
                  if (strict) {
                    deferred.reject(new Error('the content port ' + DEFAULT_CONTENT_PORT + ' is occupied.\nPlease free it and try again.\n'));
                  } else {
                    util.warn('The specified port ' + port + ' is already in use. Using available port ' + freePort + ' instead.\n');
                    deferred.resolve(freePort);
                  }
                } else {
                  deferred.resolve(port);
                }
              }
            });

            return deferred.promise;
          };

          // port
          if (taskName !== 'demo') {
            var contentPort = argv.port || DEFAULT_PREVIEW_PORT;
            return Q.all([deferredAddresses.promise, checkPort(contentPort)]);
          } else {
            var contentPort = DEFAULT_CONTENT_PORT,
              demoPort = argv.port || DEFAULT_DEMO_PORT;
            if (contentPort == demoPort) {
              return Q.reject(new Error("the demo port cannot be " + DEFAULT_CONTENT_PORT + ".\nPlease free it and try again.\n"));
            }
            return Q.all([deferredAddresses.promise, checkPort(contentPort, true), checkPort(demoPort)]);
          }
        }
      )
      .then(
        function(info) {
          var ifaces = info[0],
            contentPort = info[1],
            demoPort = info[2];

          var isTranspileEnabled = monaca.isTranspileEnabled(process.cwd());

          if (isTranspileEnabled) {
            util.checkNodeRequirement();
          }

          // Log information about IP addresses and opens browser if requested.
          var logAndOpen = function() {
            var canonicalHost = '127.0.0.1';

            if (taskName !== 'demo') {
              var address = 'http://' + canonicalHost + ':' + contentPort
                + (isTranspileEnabled ? '/webpack-dev-server/' : '');
            } else {
              var address = 'http://' + canonicalHost + ':' + demoPort;
            }

            process.stdout.write('HTTP server available on:'.yellow);
            process.stdout.write('\n  ' + address.green);

            if (taskName !== 'demo') {
              ifaces.forEach(function(iface) {
                process.stdout.write('\n  ' + address.replace(canonicalHost, iface.address).green);
              });
            }

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
              if (/bundle is now VALID|webpack: Compiled successfully/.test(string)) {
                process.stdout.write = originalWrite;
                process.stdout.write('\n');
                logAndOpen();
              }
            };
          };

          var logFn = function (req, res, error) {
            if (error) {
              console.log(
                '[%s] "%s %s" Error (%s): "%s"',
                new Date(), req.method.red, req.url.red,
                error.status.toString().red, error.message.red
              );
            }
          };

          if (taskName == 'demo') {
            // HTTP Server
            var httpServer = require('http-server');

            var demoServer = httpServer.createServer({
              root: path.resolve(__dirname, '../pages/demo'),
              cache: -1,
              logFn: logFn
            });

            demoServer.listen(demoPort, '0.0.0.0', logAndOpen);
          }


          if (isTranspileEnabled) {

            // Webpack Dev Server
            var webpack = require(path.join(monaca.userCordova, 'node_modules', 'webpack'));
            var webpackConfig = require(monaca.getWebpackConfigFile(process.cwd(), 'dev'));
            var WebpackDevServer = require(path.join(monaca.userCordova, 'node_modules', 'webpack-dev-server'));

            var server = new WebpackDevServer(webpack(webpackConfig), webpackConfig.devServer);

            server.listen(contentPort, '0.0.0.0', taskName !== 'demo' ? hookStdout : '');

          } else {

            // HTTP Server
            var httpServer = require('http-server');

            var server = httpServer.createServer({
              root: path.join(process.cwd(), 'www'),
              cache: -1,
              logFn: logFn
            });

            server.listen(contentPort, '0.0.0.0', taskName !== 'demo' ? logAndOpen : '');
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
