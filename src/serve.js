'use strict';

const spawn = require('child_process').spawn;
const util = require('./util');
const lib = require('./lib');
const Monaca = require('monaca-lib').Monaca;

let ServeTask = {}; let monaca;

/**
 * Monaca Preview commnads.
 *
 * @param {String} taskName
 * @param {Object} info Info object with client type and version
 * @return
 */
ServeTask.run = function (taskName, info) {
  monaca = new Monaca(info);
  const report = {
    event: taskName
  };
  monaca.reportAnalytics(report);

  lib.findProjectDir(process.cwd(), monaca)
    .then( dir => {
      lib.needToUpgrade(dir, monaca);
      try {
        let command = 'npm';
        if (util.isUsingYarn(dir)) {
          command = 'yarn';
        }
        if (process.platform !== 'win32') {
          spawn(command, ['run', 'monaca:preview'], {stdio: 'inherit'});
        } else {
          console.log('Running "monaca preview" on a separate terminal console. To exit this main process, please close the opened terminal windows.');
          const childProcess = spawn(command + '.cmd', ['run', 'monaca:preview'], {stdio: 'ignore', detached: true});
          childProcess.on('close', (data) => {
            console.log('\n\nExiting Program...');
            process.exit(data);
          });
        }
      } catch(ex) {
        throw ex;
      }
    })
    .catch( util.fail.bind(null, 'Project ' + taskName + ' failed: ') );
};

module.exports = ServeTask;
