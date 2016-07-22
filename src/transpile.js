var path = require('path'),
  fs = require('fs'),
  util = require(path.join(__dirname, 'util')),
  Monaca = require('monaca-lib').Monaca,
  argv = require('optimist')
    .alias('gc', 'generate-config')
    .alias('dep', 'install-dependencies')
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
      util.fail.bind(null, 'Project has failed to transpile. ')
    );
};

TranspileTask.generateBuildConfigs = function(monaca, projectDir) {
  var report = {
    event: 'transpile-config'
  };

  monaca.reportAnalytics(report);

  return monaca.generateBuildConfigs(projectDir)
    .then(
      monaca.reportFinish.bind(monaca, report),
      monaca.reportFail.bind(monaca, report)
    )
    .then(
      util.success.bind(null, 'Successfully generated transpile configuration files. '),
      util.fail.bind(null, 'Failed to generate transpile configuration files. ')
    );
};

TranspileTask.installBuildDependencies = function(monaca, projectDir) {
  var report = {
    event: 'transpile-dependencies'
  };

  monaca.reportAnalytics(report);

  return monaca.installBuildDependencies(projectDir)
    .then(
      monaca.reportFinish.bind(monaca, report),
      monaca.reportFail.bind(monaca, report)
    )
    .then(
      util.success.bind(null, 'Installation finished. '),
      util.fail.bind(null, 'Something went wrong when installing dependencies. ')
    );
};

TranspileTask.run = function(taskName, info) {
  monaca = new Monaca(info);

  var projectDir = process.cwd();
  if(!this.isValidProject(projectDir)) {
    util.fail('This directory does not contains a valid project.');
  }

  if(!monaca.isTranspilable(projectDir)) {
    util.fail('This project is not transpilable.');
  }

  if(argv.gc) {
    return this.generateBuildConfigs(monaca, projectDir);
  } else if (argv.dep) {
    return this.installBuildDependencies(monaca, projectDir);
  } else {
    return this.transpile(monaca, projectDir);
  }
};

module.exports = TranspileTask;
