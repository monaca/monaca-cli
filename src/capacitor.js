(function() {
  'use strict';
  let Capacitor = {};

  /**
   * Not-supported command names.
   */
  Capacitor.notSupportedTask = [
    'cordova', // plugin, platform, ...
    'remote',
    'signing',
    'init',
    'upgrade',
    'plugin',
    'platform',
  ];

  /**
   * Is not supported for Capacitor.
   *
   * @param {string} taskSet
   * @return {boolean}
   */
  Capacitor.isNotSupportedTask = function (taskSet) {
    return Capacitor.notSupportedTask.includes(taskSet);
  };

  module.exports = Capacitor;
}());
