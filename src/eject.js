(function() {
  'use strict';

  var path = require('path'),
    extend = require('extend'),
    open = require('open'),
    fs = require('fs'),
    Q = require('q'),
    portfinder = require('portfinder'),
    util = require(path.join(__dirname, 'util')),
    Monaca = require('monaca-lib').Monaca,
    argv = require('optimist')
    .alias('p', 'port')
    .default('open', true)
    .argv;

  var EjectTask = {}, monaca;

  EjectTask.run = function(taskName, info) {
    monaca = new Monaca(info);
    var report = {
      event: 'eject',
    };
    monaca.reportAnalytics(report);

    var projectDir = process.cwd();

  return monaca.isCordovaProject(projectDir, ['.monaca'])
    .then(function() {
      var promises = [];
      var actions = [];

      if(monaca.webpackVersion() == 2) {
        actions.push('generateBuildConfig');
      }

      actions.push('ejectPackageJson');
      actions.push('installTemplateDependencies');
      actions.push('markAsEjected');

      actions.forEach(function(action) {
        promises.push(monaca[dict[action]](projectDir));
      });

      return Q.all(promises);
    })
    .then(
      monaca.reportFinish.bind(monaca, report),
      monaca.reportFail.bind(monaca, report)
    )
    .then(
      util.success.bind(null, '\nProject is ejected. '),
      util.fail.bind(null, '\nSomething went wrong during ejectction. ')
    );
  }
  module.exports = EjectTask;
})();
