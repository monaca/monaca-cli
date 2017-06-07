(function() {
'use strict';

  var path = require('path'),
    argv = require('optimist').argv,
    Monaca = require('monaca-lib').Monaca,
    Q = require('q'),
    util = require(path.join(__dirname, 'util')),
    os = require('os'),
    opn = require('open');

  var ConfigTask = {}, monaca;

  ConfigTask.run = function(taskName, info) {
    monaca = new Monaca(info);

    console.log('before info');
    if(taskName === 'info') {
      this.showInfo();
    }
  };

  ConfigTask.showInfo = function() {
    var report = {
      event: 'info'
    };

    var display = function() {
        util.print("Node  : " + process.version);
       if(os.type() === 'darwin') {
        consutil.printole.log("OS    : macOS X");
       }
      return Q.resolve();
    };

    monaca.reportAnalytics(report);

    return display()
    .then(
      monaca.reportFinish.bind(monaca, report),
      monaca.reportFail.bind(monaca, report)
    )
    .then(
      function() {
        util.success('\nInfo displayed');
      }.bind(null),
        util.fail.bind(null, '\nSomething went wrong')
    );
  };

  module.exports = ConfigTask;
})();
