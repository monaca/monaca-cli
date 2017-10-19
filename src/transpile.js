var path = require('path'),
  fs = require('fs'),
  exec = require('child_process').exec,
  util = require(path.join(__dirname, 'util')),
  Monaca = require('monaca-lib').Monaca,
  projectConfig;

var TranspileTask = {}, monaca;

TranspileTask.run = function(taskName, info) {
  try {
    projectConfig = require(path.join(process.cwd(), 'package.json'));
  } catch (err) {
    transpileProject(taskName, info);
  }

  if (projectConfig && projectConfig.scripts && projectConfig.scripts.build) {
    var childProcess = exec('npm run build');

    childProcess.stdout.on('data', function(data) {
      process.stdout.write(data.toString());
    });

    childProcess.stderr.on('data', function(data) {
      if (data) {
        process.stderr.write(data.toString().error);
      }
    });
  } else {
    transpileProject(taskName, info);
  }
};

var transpileProject = function(taskName, info) {
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
