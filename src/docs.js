(function() {
'use strict';

  var path = require('path'),
    argv = require('optimist').argv,
    Monaca = require('monaca-lib').Monaca,
    Q = require('q'),
    util = require(path.join(__dirname, 'util')),
    opn = require('open');

  var ConfigTask = {}, monaca;

  ConfigTask.run = function(taskName, info) {
    monaca = new Monaca(info);
    var docsType = argv._[1];
    if (taskName === 'docs') {
      this.openDocs(docsType);
    }
  };

  ConfigTask.openDocs = function(docsType) {
    var rawArgv = process.argv.slice(3);
    var report = {
      event: 'docs',
      arg1: rawArgv
    };

    var openDocs = function(docsType) {
      try {
        if (docsType === 'onsen') {
          opn('https://onsen.io/v2/guide/');
        } else if (docsType === 'tutorial') {
          opn('http://tutorial.onsen.io/');
        } else if (docsType === 'usage') {
          opn('http://docs.monaca.io/en/manual/development/monaca_cli/');
        } else {
          return Q.reject(docsType + ' is not a valid argument of monaca docs command.');
        }
        return Q.resolve();
      } catch (error) {
        return Q.reject(error);
      }
    };

    monaca.reportAnalytics(report);

    return openDocs(docsType)
    .then(
      monaca.reportFinish.bind(monaca, report),
      monaca.reportFail.bind(monaca, report)
    )
    .then(
      util.success.bind(null, '\nDocumentation displayed in the browser window.'),
      util.fail.bind(null, '\nSomething went wrong while opening the documentation: ')
    );
  };

  module.exports = ConfigTask;
})();
