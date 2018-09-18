'use strict';

let path = require('path');
let exec = require('child_process').exec;
let util = require(path.join(__dirname, 'util'));
let lib = require(path.join(__dirname, 'lib'));
let Monaca = require('monaca-lib').Monaca;

let CordovaTask = {}; let monaca;

CordovaTask.run = function(taskName, info) {
  
  monaca = new Monaca(info);
  
  lib.findProjectDir(process.cwd(), monaca)
  .then( (projectDir) => {
    try { lib.needToUpgrade(projectDir, monaca); } catch (err) { util.fail(`${err}`); }

    let cordovaJson;
    
    try {
      cordovaJson = require(path.join(projectDir, 'node_modules', 'cordova', 'package.json'));
    } catch (err) {
      util.fail(`${err}\n`);
    }
    
    util.warn('Attention, the requested command is a Cordova CLI ' + (cordovaJson.version ? cordovaJson.version : '') + ' command.');
    util.warn('In case of issue, refer to the official Cordova CLI documentation.\n');

    let args = process.argv.length > 3 ? process.argv.slice(3).join(' ') : '';
    let cmd = path.join(projectDir, 'node_modules', '.bin', 'cordova') + ' ' + taskName + ' ' + args;

    let needReport = taskName === 'plugin' && process.argv[3], reportErrors = '';
    let report = {
      event: 'plugin',
      arg1: args
    };

    if (needReport) {
      monaca.reportAnalytics(report);
    }

    let childProcess = exec(cmd);

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
  });
};

module.exports = CordovaTask;
