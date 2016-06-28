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

          var npmProcess = exec('npm install --loglevel error', {cwd: path.join(__dirname, 'serve')});

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
   this.assureCordovaProject(process.cwd()).then(function() {
    process.env.NODE_PATH = monaca.USER_CORDOVA;

    var webpack = monaca.getWebPackModule();
    var WebpackDevServer = monaca.getWebpackDevServer();
    var config = monaca.getWebPackConfigs(process.cwd());
    config.entry.unshift("webpack-dev-server/client?http://0.0.0.0:8080/");
    config.plugins = [
      new webpack.HotModuleReplacementPlugin()
    ];

    var compiler = webpack(config);
    var server = new WebpackDevServer(compiler, {
      hot: true,
      compress: true,
      quiet: false,
      noInfo: false,
      watchOptions: {
        aggregateTimeout: 300,
        poll: 1000
      },
      stats: { colors: true }
    });

    server.listen(8080, 'localhost', function(){});
  });
};
module.exports = ServeTask;
})();
