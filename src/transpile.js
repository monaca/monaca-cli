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
  return monaca.transpile(process.cwd()).then(
    util.success.bind(null),
    util.fail.bind(null, 'Project has failed to transpile.')
  );
};

module.exports = TranspileTask;