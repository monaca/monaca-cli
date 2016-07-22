var path = require('path'),
  fs = require('fs'),
  util = require(path.join(__dirname, 'util')),
  Monaca = require('monaca-lib').Monaca,
  argv = require('optimist')
    .alias('gc', 'generate-configs')
    .argv;

var TranspileTask = {}, monaca;

/*
 * Check if valid project directory.
 */
TranspileTask.isValidProject = function(projectPath) {
  try {
    return fs.statSync(path.join(projectPath, 'www')).isDirectory();
  } catch (e) {
    return false;
  }
};

/*
 * Check if valid project directory.
 */
TranspileTask.transpile = function(monaca, projectDir) {
  var report = {
    event: 'transpile'
  };

  monaca.reportAnalytics(report);

  return monaca.transpile(projectDir)
    .then(
      monaca.reportFinish.bind(monaca, report),
      monaca.reportFail.bind(monaca, report)
    )
    .then(
      util.success.bind(null),
      util.fail.bind(null, 'Project has failed to transpile.')
    );
};

/*
 * Check if valid project directory.
 */
TranspileTask.generateWebpackConfigs = function(monaca, projectDir) {
  var report = {
    event: 'transpileGenerateConfigs'
  };

  monaca.reportAnalytics(report);

  return monaca.generateBuildConfigs(projectDir)
    .then(
      monaca.reportFinish.bind(monaca, report),
      monaca.reportFail.bind(monaca, report)
    )
    .then(
      function() {
        util.success('Successfully created transpile configs.');
      },
      function() {
        util.fail('Failed to create transpile configs.');
      }
    );
};

TranspileTask.run = function(taskName, info) {
  monaca = new Monaca(info);

  var projectDir = process.cwd();
  if(!this.isValidProject(projectDir)) {
    util.fail('This directory does not contains a valid project.');
  }

  if(argv.gc && !monaca.isTranspilable(projectDir)) {
    util.fail('Transpile configs can not be created for this project type.');
  }

  if(argv.gc) {
    return this.generateWebpackConfigs(monaca, projectDir);
  } else {
    return this.transpile(monaca, projectDir);
  }
};

module.exports = TranspileTask;