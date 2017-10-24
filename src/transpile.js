var path = require('path'),
  fs = require('fs'),
  exec = require('child_process').exec,
  util = require(path.join(__dirname, 'util')),
  lib = require(path.join(__dirname, 'lib')),
  Monaca = require('monaca-lib').Monaca;

var TranspileTask = {}, monaca;

TranspileTask.run = function(taskName, info) {
  monaca = new Monaca(info);

  lib.findProjectDir(process.cwd(), monaca)
  .then(
    function(dir) {
      var projectDir = dir,
        projectConfig;

      try {
        projectConfig = require(path.join(projectDir, 'package.json'));
      } catch (err) {
        return transpileProject(taskName, projectDir);
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
        return transpileProject(taskName, projectDir);
      }
    }
  )
  .catch(util.fail.bind(null, 'Project ' + taskName + ' failed: '));
};

var transpileProject = function(taskName, projectDir) {
  if (!monaca.isTranspilable(projectDir)) {
    util.fail('This project is not transpilable.');
  }

  var report = {
    event: 'transpile'
  };

  monaca.reportAnalytics(report);

  var isTranspileEnabled = monaca.isTranspileEnabled(projectDir);

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
