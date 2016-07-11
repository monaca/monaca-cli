var path = require('path'),
  fs = require('fs'),
  util = require(path.join(__dirname, 'util')),
  Monaca = require('monaca-lib').Monaca;

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

TranspileTask.run = function(taskName, info) {
  monaca = new Monaca(info);

  var projectDir = process.cwd();
  if(!this.isValidProject(projectDir)) {
    util.fail('This directory does not contains a valid project.');
  }

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

module.exports = TranspileTask;