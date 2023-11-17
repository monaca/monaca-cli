(function() {
  'use strict';
  let Capacitor = {};

  /**
   * Not-supported command names.
   */
  Capacitor.notSupportedTask = [
    'remote config',
    'remote build',
    'signing',
    'init',
    'upgrade',
    'update',
    'debug',
    'plugin',
    'platform',
    'prepare',
    'compile',
    'run',
    'build',
    'emulate',
  ];

  /**
   * Is not supported for Capacitor.
   *
   * @param {string} taskName
   * @return {boolean}
   */
  Capacitor.isNotSupportedTask = function (taskName) {
    return Capacitor.notSupportedTask.includes(taskName);
  };

  module.exports = Capacitor;
}());
