const util = require('./util');
const lib = require('./lib');
const Monaca = require('monaca-lib').Monaca;

/**
 * Monaca Upgrade commnads.
 *
 * @param {String} taskName
 * @param {Object} info Info object with client type and version
 * @return
 */
module.exports = {
  run: (taskName, info) => {
    let monaca = new Monaca(info);

    // Checking if the path is under a Monaca Project.
    lib.findProjectDir(process.cwd(), monaca)
      .then( projectDir => lib.executeUpgrade(projectDir, monaca) )
      .then( projectDir => util.success(`${projectDir}; ${taskName} process finished.`) )
      .catch( err => util.fail(`Project ${taskName} failed. ${err}`) );

  }
}