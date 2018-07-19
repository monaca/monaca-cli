const util = require('./util');
const lib = require('./lib');
const Monaca = require('monaca-lib').Monaca;
const inquirer = require('inquirer');

/**
 * Monaca Upgrade commnads.
 *
 * @param {string}
 * @param {object} info Info object with client type and version
 * @param {object} options Info object with client type and version
 * @return
 */
module.exports = {
  run: (taskName, info) => {
    let monaca = new Monaca(info);

    // Checking if the path is under a Monaca Project.
    lib.findProjectDir(process.cwd(), monaca)
    .then(
      (projectDir) => {

        if (monaca.isOldProject(projectDir)) {
          return inquirer.prompt(
            [
              {
                type: 'confirm',
                name: 'alias_upgrade_type',
                message: 'We are going to install some new build dependencies inside the project and to overwrite the package.json injecting some commands under the \'scripts\' tag.\n\n Are you sure you want to upgrade your project?',
                default: false
              }
            ]
          )
          .then(
            (answer) => {
              if (answer.alias_upgrade_type) {
                return monaca.upgrade(projectDir); 
              } else {
                util.warn('To avoid any kind of problem we recommend downgrading to Monaca CLI 2.7.x.');
              }
            }  
          );
        } else {
          util.warn('The project is already the latest version.');
        }

      }
    )
    .catch(util.fail.bind(null, 'Project ' + taskName + ' failed: '));

  }
}