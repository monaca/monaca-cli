var path = require('path'),
  fs = require('fs'),
  util = require(path.join(__dirname, 'util')),
  Monaca = require('monaca-lib').Monaca;

var TranspileTask = {};
var monaca = new Monaca();

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

TranspileTask.run = function(taskName) {
  var projectDir = process.cwd();

  if(!this.isValidProject(projectDir)) {
    util.fail('This directory does not contains a valid project.');
  }

  if(!monaca.requireTranspile(projectDir)) {
    util.fail('This project can not be transpiled.');
  }

  util.print('Transpiling Project: ' + projectDir);
  return monaca.transpile(projectDir).then(
    util.success.bind(null, 'Project has successfully transpiled.'),
    util.fail.bind(null, 'Project has failed to transpile.')
  );
};

module.exports = TranspileTask;