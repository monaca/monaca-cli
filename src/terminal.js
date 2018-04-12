(function() {
  'use strict';
  var Terminal = {};

  /**
   * Is Monaca Terminal.
   *
   * @return {boolean}
   */
  Terminal.isOnMonaca = (process.env.MONACA_TERMINAL == 1);

  /**
   * Allowed command names on Monaca Terminal.
   */
  Terminal.commands = [
    'preview',
    'serve',
    'transpile',
    'demo',
    'reconfigure',
    'info',
  ];

  /**
   * Is valid task on Monaca Terminal.
   *
   * @param {string} taskName
   * @return {boolean}
   */
  Terminal.isValidTask = function (taskName) {
    if (Terminal.isOnMonaca) {
      return Terminal.commands.includes(taskName);
    }

    return true;
  };

  /**
   * Invalid command error message template.
   */
  Terminal.invalidCommandMessage= 'This task is not supported when running on Monaca Terminal. Run `monaca --help` to show all available tasks.';

  /**
   * Get invalid command error message.
   *
   * @param {string} taskName
   * @returns {string}
   */
  Terminal.getInvalidCommandErrorMessage = function(taskName) {
    return Terminal.invalidCommandMessage.replace('___TASK_NAME___', taskName);
  };

  module.exports = Terminal;
}());
