(function() {
'use strict';

var path = require('path'),
  exec = require('child_process').exec,
  util = require(path.join(__dirname, 'util')),
  Monaca = require('monaca-lib').Monaca;

var CordovaTask = {}, monaca;

CordovaTask.run = function(taskName, info) {
  var cordovaJson = require(path.join(__dirname, '..', 'node_modules', 'cordova', 'package.json'));
  util.warn('Attention, the requested command is a Cordova CLI ' + (cordovaJson.version ? cordovaJson.version : '') + ' command.');
  util.warn('In case of issue, refer to the official Cordova CLI documentation.\n');

  monaca = new Monaca(info);
  var args = process.argv.length > 3 ? process.argv.slice(3).join(' ') : '';
  var cmd = path.join(__dirname, '..', 'node_modules', '.bin', 'cordova') + ' ' + taskName + ' ' + args;

  var needReport = taskName === 'plugin' && process.argv[3], reportErrors = '';
  var report = {
    event: 'plugin',
    arg1: args
  };

  if (needReport) {
    monaca.reportAnalytics(report);
  }

  var childProcess = exec(cmd);

  childProcess.stdout.on('data', function(data) {
    process.stdout.write(data.toString());
  });

  childProcess.stderr.on('data', function(data) {
    if (data) {
      reportErrors += data.toString();
      process.stderr.write(data.toString().error);
    }
  });

  childProcess.on('exit', function(code, qwe) {
    if (needReport) {
      monaca[code ? 'reportFail' : 'reportFinish'](report, reportErrors).then(
        process.exit.bind(process, code),
        process.exit.bind(process, code)
      );
    } else {
      if (code) {
        process.exit(code);
      }
    }
  });
};

module.exports = CordovaTask;
})();
