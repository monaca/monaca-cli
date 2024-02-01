'use strict';

let path = require('path');
let exec = require('child_process').exec;
let util = require(path.join(__dirname, 'util'));
let lib = require(path.join(__dirname, 'lib'));
let Monaca = require('monaca-lib').Monaca;

const addPlugin = require('./cordova-cli-overrides/add-plugin-command');
const removePlugin = require('./cordova-cli-overrides/remove-plugin-command');
const listPlugins = require('./cordova-cli-overrides/list-plugins-command');

let CordovaTask = {}; let monaca;

const isAddCMD = args => args[3] === 'add' && args[4];
const isRmCMD = args => (args[3] === 'rm' || args[3] === 'remove') && args[4];
const isListCMD = args => args[3] === 'list';

CordovaTask.run = async function (taskName, info) {

  monaca = new Monaca(info);
  const args = process.argv.length > 3 ? process.argv.slice(3).join(' ') : '';

  const report = {
    event: 'plugin',
    params: { args }
  };
  monaca.reportAnalytics(report);

  const projectDir = await lib.findProjectDir(process.cwd(), monaca);

  try { lib.needToUpgrade(projectDir, monaca); } catch (err) { util.fail(`${err}`); }

  let cordovaJson;

  try {
    cordovaJson = require(path.join(projectDir, 'node_modules', 'cordova', 'package.json'));
  } catch (err) {
    util.fail(`${err}\n`);
  }

  const pluginArg = process.argv;
  if (isAddCMD(process.argv)) {
    try {
      return await addPlugin(process.argv, projectDir);
    }
    catch (e) {
      console.log(`Can't add plugin: ${pluginArg}. Reason: ${e.message}`);
    }
  } else if (isRmCMD(process.argv)) {
    try {
      return removePlugin(process.argv, projectDir);
    } catch (e) {
      console.log(`Can't remove plugin: ${pluginArg}. Reason: ${e.message}`);
    }
  } else if (isListCMD(process.argv)) {
    try {
      return listPlugins(process.argv, projectDir);
    }
    catch (e) {
      console.log(`Can't list plugins: ${pluginArg}. Reason: ${e.message}`);
    }
  } else {

    util.warn('Attention, the requested command is a Cordova CLI ' + (cordovaJson.version ? cordovaJson.version : '') + ' command.');
    util.warn('In case of issue, refer to the official Cordova CLI documentation.\n');

    let cmd = path.join(projectDir, 'node_modules', '.bin', 'cordova') + ' ' + taskName + ' ' + args;

    let needReport = taskName === 'plugin' && process.argv[3], reportErrors = '';

    let childProcess = exec(cmd);

    childProcess.stdout.on('data', function (data) {
      process.stdout.write(data.toString());
    });

    childProcess.stderr.on('data', function (data) {
      if (data) {
        reportErrors += data.toString();
        process.stderr.write(data.toString().error);
      }
    });

    childProcess.on('exit', function (code, qwe) {
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
  }
};

module.exports = CordovaTask;
