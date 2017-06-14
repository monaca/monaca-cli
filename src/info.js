(function() {
'use strict';

  var path = require('path'),
    Monaca = require('monaca-lib').Monaca,
    util = require(path.join(__dirname, 'util')),
    os = require('os'),
    compareVersions = require('compare-versions'),
    ip = require('ip'),
    rp = require('request-promise');

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

    var returnWithSpace = function(str) {
      return str +  Array(17 - str.length).join(' ');
    };

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
        osInfo = 'Windows ' + os.release()[0];
      } else {
        osInfo = 'linux';
      }
      return osInfo;
    };

    var getOnsenVersion = function(framework) {
      var onsenVersion;
      if(monaca.isTranspilable(process.cwd())) {
        onsenVersion = require(path.join(process.cwd(), 'node_modules', 'onsenui', 'package.json')).version;
      } else if(framework === 'onsenui' || framework === 'angular') {
        var libDir = path.join(process.cwd(), 'www', 'lib')
        onsenVersion = require(path.join(libDir, 'onsenui', 'package.json')).version;
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
      if(monaca.isTranspilable(process.cwd())) {
        version = require(path.join(process.cwd(), 'node_modules', framework + '-onsenui' , 'package.json')).version;
      }
      return version;
    };

    var displaySystem = function() {
      util.print('System'.blue.bold);
      try {
        var os = getOperatingSystem(),
          nodeVersion = process.versions.node,
          npmVersion = require('global-npm').version;

        if(os) {
          util.print(leftIndent + 'os              :' + middleSpace + os.grey);
        }
        if(nodeVersion) {
          util.print(leftIndent + 'node            :' + middleSpace + nodeVersion.grey);
        }
        if(npmVersion) {
          util.print(leftIndent + 'npm             :' + middleSpace + npmVersion.grey + '\n');
        }
      } catch(err) {
        util.print('There was problem when displaying framework info'.red);
      }
    };

    var displayGlobal = function() {
      try {
        var cliPackage = require(path.join(__dirname, '..', 'package.json'));
        util.print('Monaca dependencies'.blue.bold);
        util.print(leftIndent + 'monaca-lib      :' + middleSpace + cliPackage.dependencies['monaca-lib'].grey);
        util.print(leftIndent + 'monaca-cli      :' + middleSpace + cliPackage.version.grey + '\n');
      } catch(err) {
        util.print('Problem occured during displaying Monaca dependencies'.red);
      }
    };

    var displayFrameworkInfo = function() {
      util.print('Framework info'.blue.bold);
      try {
        var framework = util.getTemplateFramework(),
          projectInfo = require(path.join(process.cwd(), '.monaca', 'project_info.json')),
          onsenVersion = getOnsenVersion(framework),
          supportedFrameworkVersion = getSupportedFrameworkVersion(framework),
          onsenBindingVersion = getBindingVersion(framework);

        util.print(leftIndent + 'cordova         :' + middleSpace + projectInfo['cordova_version'].grey);

        if(onsenVersion) {
          util.print(leftIndent + returnWithSpace('onsenui') + ':' + middleSpace + onsenVersion.grey);
        }
        if(supportedFrameworkVersion) {
          util.print(leftIndent + returnWithSpace(framework) + ':' + middleSpace + supportedFrameworkVersion.grey);
        }
        if(onsenBindingVersion) {
          util.print(leftIndent + returnWithSpace(framework + '-onsenui') + ':' + middleSpace  + onsenBindingVersion.grey);
        }
        util.print('');

      } catch(error) {
        util.print('There was problem when displaying framework info'.red);
      }
    };


    var getConnectionInfo = function() {
      var options = {
        method: 'POST',
        url: 'https://ide.monaca.mobi/server_check',
        body: {},
        json: true
      };

      var start = new Date().getTime();
      rp(options).then(function(res) {
        var end = new Date().getTime();
        var time = end - start;
        util.print('Monaca cloud connection'.blue.bold);
        util.print(leftIndent +'status          :' + middleSpace + 'successful'.green);
        util.print(leftIndent +'time            :' + middleSpace + (time + ' ms').grey);
        util.print(leftIndent +'local ip        :' + middleSpace + ip.address().grey);
      },
      function(err) {
      util.print('Connection problem occured'.red);
      });
    };

    monaca.isCordovaProject(process.cwd())
      .then(
        function() {
          displayGlobal();
          displaySystem();
          displayFrameworkInfo();
          getConnectionInfo();
        },
        function() {
          util.print('Not cordova project: missing project context'.yellow);
          displayGlobal();
          displaySystem();
          getConnectionInfo();
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
