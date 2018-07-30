const util = require('./util');
const lib = require('./lib');
const Monaca = require('monaca-lib').Monaca;
const argv = require('optimist').argv;

/**
 * Monaca Upgrade commnads.
 *
 * @param {String} taskName
 * @param {Object} info Info object with client type and version
 * @param {Object} options Options to execute Upgrade
 * @return
 */
module.exports = {
  run: (taskName, info, options) => {
    let monaca = new Monaca(info);
    const force = !!argv.force || (options && options.force) || false;

    process.on('SIGINT', err => util.fail(`Project ${taskName} failed. ${err}`) );

    // Checking if the path is under a Monaca Project.
    lib.findProjectDir(process.cwd(), monaca)
      .then( projectDir => lib.executeUpgrade(projectDir, monaca, force) )
      .then( data => util.success(data.message ? `${data.message} ${taskName} process finished.`: `${taskName} process finished.`) )
      .catch( err => util.fail(`Project ${taskName} failed. ${err}`) );

  }
}