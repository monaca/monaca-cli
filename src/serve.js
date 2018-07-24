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
  lib.findProjectDir(process.cwd(), monaca)
    // Checking if the user needs to upgrade the project
    .then( dir => lib.executeUpgrade(dir, monaca) )
    // Executing
    .then( () => spawn('npm', ['run', 'monaca:preview'], {stdio: 'inherit'}) )
    .catch( util.fail.bind(null, 'Project ' + taskName + ' failed: ') );
};

module.exports = ServeTask;