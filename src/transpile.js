var path = require('path'),
  fs = require('fs'),
  util = require(path.join(__dirname, 'util')),
  Monaca = require('monaca-lib').Monaca;

var TranspileTask = {}, monaca;

TranspileTask.run = function(taskName, info) {
  var projectDir = process.cwd();
  monaca = new Monaca(info);

  if (!monaca.isTranspilable(projectDir)) {
    util.fail('This project is not transpilable.');
  }

  var report = {
    event: 'transpile'
  };

  monaca.reportAnalytics(report);

  var isTranspileEnabled = monaca.isTranspileEnabled(process.cwd());

  if (isTranspileEnabled) {
    util.checkNodeRequirement();
  }

  return monaca.transpile(projectDir)
    .then(
      monaca.reportFinish.bind(monaca, report),
      monaca.reportFail.bind(monaca, report)
    )
    .then(
      util.success.bind(null),
      util.fail.bind(null, 'Project has failed to transpile. ')
    );
};

module.exports = TranspileTask;
