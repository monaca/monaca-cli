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
    let opts = {}, projectDir;
    opts.overwrite = !!argv.force || (options && options.force) || false;
    opts.createPackageJson = !!argv.createPackageJson || (options && options.createPackageJson) || false;

    process.on('SIGINT', err => util.fail(`Project ${taskName} failed. ${err}`) );

    // Checking if the path is under a Monaca Project.
    lib.findProjectDir(process.cwd(), monaca)
      .then( dir => {
        projectDir = dir;
        if (monaca.isOldProject(projectDir)) {
          if (parseFloat(monaca.getCordovaVersion(projectDir)) >= 7.1 || opts.createPackageJson) {
            const message = 'Your project was created using Monaca CLI 2.x so you need to upgrade your project or downgrading your Monaca CLI version to 2.x. \n\n We are going to install some new build dependencies inside the project and to overwrite the package.json injecting some commands under the \'scripts\' tag. \n\n Do you want to upgrade your project?';
            return lib.confirmMessage(message, true, opts.overwrite);
          } else {
            throw 'Your project is using a previous version of Cordova (< 7.1). You need to execute \'monaca upgrade --createPackageJson\' to create a package.json file.';
          }
        } else {
          throw 'The project is already the latest version.';
        }
      })
      .then(
        (answer) => {
          if(answer.value) return lib.overwriteScriptsUpgrade(opts.overwrite);
          else {
            util.warn('To avoid any kind of problem we recommend downgrading to Monaca CLI 2.x');
            throw 'Using an old version of Monaca CLI.';
          }
        }
      )
      .then( answer => { if (answer) { opts.overwrite = answer.value; return monaca.upgrade(projectDir, opts); } })
      .then( () => util.success(`${taskName} process finished.`) )
      .catch( err => util.fail(`Project ${taskName} failed. ${err}`) );
  }
}