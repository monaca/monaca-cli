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
    .then( dir => {
      lib.needToUpgrade(dir, monaca);
      try { spawn('npm', ['run', 'monaca:preview'], {stdio: 'inherit'}); } catch(ex) { throw ex; }
    })
    .catch( util.fail.bind(null, 'Project ' + taskName + ' failed: ') );
};

module.exports = ServeTask;