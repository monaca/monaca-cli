(function() {
  'use strict';

  var path = require('path'),
    exec = require('child_process').exec;

  var CordovaTask = {};

  CordovaTask.run = function(taskName) {
    var args = process.argv.length > 3 ? process.argv.slice(3).join(' ') : '';
    var cmd = path.join(__dirname, '..', 'node_modules', '.bin', 'cordova') + ' ' + taskName + ' ' + args;

    var childProcess = exec(cmd);

    childProcess.stdout.on('data', function(data) {
      process.stdout.write(data.toString());
    });

    childProcess.stderr.on('data', function(data) {
      if (data) {
        process.stderr.write(data.toString().error);
      }
    });

    childProcess.on('exit', function(code) {
      if (code !== 0) {
        process.exit(code);
      }
    });
  };

  module.exports = CordovaTask;
})();
