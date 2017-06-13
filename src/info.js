(function() {
'use strict';

  var path = require('path'),
    argv = require('optimist').argv,
    Monaca = require('monaca-lib').Monaca,
    Q = require('q'),
    util = require(path.join(__dirname, 'util')),
    os = require('os'),
    opn = require('open'),
    colors = require('colors'),
    fs = require('fs'),
    path = require('path'),
    compareVersions = require('compare-versions');

  var ConfigTask = {}, monaca;

  ConfigTask.run = function(taskName, info) {
    monaca = new Monaca(info);

    if(taskName === 'info') {
      this.showInfo();
    }
  };

  ConfigTask.showInfo = function() {
    var report = {
      event: 'info'
    };

    monaca.reportAnalytics(report);
    var leftIndent = '      ';
    var middleSpace = '  ';

    var mapOSX = function() {
      var darwinVersion = os.release();
      if(compareVersions(darwinVersion, '16.0.0') >= 0 && compareVersions(darwinVersion, '17.0.0') < 0) {
        return 'macOS Sierra';
      } else if(compareVersions(darwinVersion, '15.0.0') >= 0 && compareVersions(darwinVersion, '16.0.0') < 0) {
       return 'OS X El Capitan';
      } else if(compareVersions(darwinVersion, '14.0.0') >= 0 && compareVersions(darwinVersion, '15.0.0') < 0) {
       return 'OS X Yosemite';
      } else if(compareVersions(darwinVersion, '13.0.0') >= 0 && compareVersions(darwinVersion, '14.0.0') < 0) {
       return 'OS X Maverics';
      } else if(compareVersions(darwinVersion, '12.0.0') >= 0 && compareVersions(darwinVersion, '13.0.0') < 0) {
       return 'OS X Mountain Lion';
      } else {
        return 'macOS';
      }
    };

    var getOperatingSystem = function() {
      var osInfo;
      if(process.platform === 'darwin') {
        osInfo = mapOSX();
      } else if(process.platform === 'win32') {
        osInfo = 'Windows ' + os.release()[0]
      } else {
        osInfo = 'linux';
      }
      return osInfo;
    };

    var getOnsenVersion = function(framework) {
      var onsenVersion;
      if(framework === 'angular2' || framework === 'react' || framework === 'vue') {
        var onsenVersion = require(path.join(process.cwd(), 'node_modules', 'onsenui', 'package.json')).version;
      } else if(framework === 'onsenui' || framework === 'angular') {
        var libDir = path.join(process.cwd(), 'www', 'lib')
        var onsenVersion = require(path.join(libDir, 'onsenui', 'package.json')).version;
      }
      return onsenVersion;
    };

    var getSupportedFrameworkVersion = function(framework) {
      var libDir = path.join(process.cwd(), 'www', 'lib');
      var version;
      if(framework === 'react' || framework === 'vue') {
        version = require(path.join(process.cwd(), 'node_modules', framework , 'package.json')).version;
      } else if(framework === 'angular') {
        version = require(path.join(libDir, 'angular', 'package.json')).version;
      } else if(framework === 'angular2') {
        version = require(path.join(process.cwd(), 'node_modules', '@angular', 'core', 'package.json')).version;
      } else if(framework === 'ionic') {
        version = require(path.join(libDir, 'ionic', 'version.json')).version;
      }
      return version;
    };

    var getBindingVersion = function(framework) {
      var version;
      if(framework === 'angular2' || framework === 'react' || framework === 'vue') {
        version = require(path.join(process.cwd(), 'node_modules', framework + '-onsenui' , 'package.json')).version;
      }
      return version;
    };

    var displaySystem = function() {
      var os = getOperatingSystem(),
        nodeVersion = process.versions.node,
        npmVersion = require('global-npm').version;

      util.print('System'.blue.bold);
      if(os) {
        util.print(leftIndent + 'os              :' + middleSpace + os.grey);
      }
      if(nodeVersion) {
        util.print(leftIndent + 'node            :' + middleSpace + nodeVersion.grey);
      }
      if(npmVersion) {
        util.print(leftIndent + 'npm             :' + middleSpace + npmVersion.grey + '\n');
      }
    };

    var displayGlobal = function() {
      var cliPackage = require(path.join(__dirname, '..', 'package.json'));
      util.print('Global dependencies'.blue.bold);
      util.print(leftIndent + 'monaca-lib      :' + middleSpace + cliPackage.dependencies['monaca-lib'].grey);
      util.print(leftIndent + 'monaca-cli      :' + middleSpace + cliPackage.version.grey + '\n');
    };

    var displayFrameworkInfo = function() {
      var framework = util.determineFramework(),
        projectInfo = require(path.join(process.cwd(), '.monaca', 'project_info.json')),
        onsenVersion = getOnsenVersion(framework),
        supportedFrameworkVersion = getSupportedFrameworkVersion(framework),
        onsenBindingVersion = getBindingVersion(framework);

      util.print('Framework info'.blue.bold);
      util.print(leftIndent + 'cordova         :' + middleSpace + projectInfo['cordova_version'].grey);
      if(onsenVersion) {
        util.print(leftIndent + 'onsenui' + Array(17 - 'onsenui'.length).join(' ') + ':' + middleSpace + onsenVersion.grey);
      }
      if(supportedFrameworkVersion) {
        util.print(leftIndent + framework + Array(17 - framework.length).join(' ') + ':' + middleSpace + supportedFrameworkVersion.grey);
        if(onsenBindingVersion) {
          util.print(leftIndent + framework + '-onsenui' + Array(16 - (framework + '-onsenui').length).join(' ') + ':' + middleSpace  + onsenBindingVersion.grey);
        }
      }
    };

    return monaca.isCordovaProject(process.cwd())
    .then(
      function() {
        try {
          displayGlobal();
          displaySystem();
          displayFrameworkInfo();
        } catch(error) {}
      },
      function() {
        util.print('Not cordova project: missing project context'.yellow);
        displayGlobal();
        displaySystem();
      }
    )
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
