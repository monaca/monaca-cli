(function() {
'use strict';

  var path = require('path'),
    Monaca = require('monaca-lib').Monaca,
    util = require(path.join(__dirname, 'util')),
    os = require('os'),
    compareVersions = require('compare-versions'),
    ip = require('ip'),
    fs = require('fs');

  var ConfigTask = {}, monaca;

  ConfigTask.run = function(taskName, info) {
    monaca = new Monaca(info);

    this.showInfo();
  };

  ConfigTask.showInfo = function() {
    var report = {
      event: 'info'
    };

    monaca.reportAnalytics(report);
    var leftIndent = '      ';
    var middleSpace = '  ';


    var fileExists = function (filePath) {
      try {
        return fs.statSync(filePath).isFile();
      } catch (err) {
        return false;
      }
    };

    var mapOSX = function() {
      var darwinVersion = os.release();
      if (compareVersions(darwinVersion, '16.0.0') >= 0 && compareVersions(darwinVersion, '17.0.0') < 0) {
        return 'macOS Sierra';
      } else if (compareVersions(darwinVersion, '15.0.0') >= 0 && compareVersions(darwinVersion, '16.0.0') < 0) {
        return 'OS X El Capitan';
      } else if (compareVersions(darwinVersion, '14.0.0') >= 0 && compareVersions(darwinVersion, '15.0.0') < 0) {
        return 'OS X Yosemite';
      } else if (compareVersions(darwinVersion, '13.0.0') >= 0 && compareVersions(darwinVersion, '14.0.0') < 0) {
        return 'OS X Maverics';
      } else if (compareVersions(darwinVersion, '12.0.0') >= 0 && compareVersions(darwinVersion, '13.0.0') < 0) {
        return 'OS X Mountain Lion';
      } else {
        return 'macOS';
      }
    };

    var getTemplateVersions = function() {
      var result = {};
      var libDir = path.join(process.cwd(), 'www/lib');

      var onsenPaths = [
        path.join(libDir, 'onsenui', 'package.json'),
        path.join(process.cwd(), 'node_modules', 'onsenui', 'package.json')
      ];

      var versionsPaths = {
       'ionic' : path.join(libDir, 'ionic', 'version.json'),
       'angular' : path.join(libDir, 'angular', 'package.json'),
       'vue' : path.join(process.cwd(), 'node_modules', 'vue' , 'package.json'),
       'react' : path.join(process.cwd(), 'node_modules', 'react' , 'package.json'),
       'angular2' : path.join(process.cwd(), 'node_modules', '@angular', 'core', 'package.json'),
       'vue-onsenui' : path.join(process.cwd(), 'node_modules', 'vue-onsenui' , 'package.json'),
       'react-onsenui' : path.join(process.cwd(), 'node_modules', 'react-onsenui' , 'package.json'),
       'angular2-onsenui' : path.join(process.cwd(), 'node_modules', 'angular2-onsenui', 'package.json')
      };

      for (var i in onsenPaths) {
        if (fileExists(onsenPaths[i])) {
          result.onsen = require(onsenPaths[i]).version;
        }
      }

      for (var i in versionsPaths) {
        if (fileExists(versionsPaths[i])) {
          result[i] = require(versionsPaths[i]).version;
        }
      }

      return result;
    };

    var getOperatingSystem = function() {
      var osInfo;
      if (process.platform === 'darwin') {
        osInfo = mapOSX();
      } else if (process.platform === 'win32') {
        osInfo = 'Windows';
      } else {
        osInfo = 'linux';
      }
      return osInfo;
    };

    var displaySystem = function() {
      util.print('System'.blue.bold);
      try {
        var os = getOperatingSystem(),
          nodeVersion = process.versions.node,
          npmVersion = require('global-npm').version;

        if (os) {
          util.print(leftIndent + 'os              :' + middleSpace + os.grey);
        }
        if (nodeVersion) {
          util.print(leftIndent + 'node            :' + middleSpace + nodeVersion.grey);
        }
        if (npmVersion) {
          util.print(leftIndent + 'npm             :' + middleSpace + npmVersion.grey + '\n');
        }
      } catch (err) {
        util.print('Problem occurred during displaying system info'.red);
      }
    };

    var displayGlobal = function() {
      try {
        var cliPackage = require(path.join(__dirname, '..', 'package.json'));
        util.print('Monaca dependencies'.blue.bold);
        util.print(leftIndent + 'monaca-lib      :' + middleSpace + cliPackage.dependencies['monaca-lib'].grey);
        util.print(leftIndent + 'monaca-cli      :' + middleSpace + cliPackage.version.grey + '\n');
      } catch (err) {
        util.print('Problem occurred during displaying Monaca dependencies'.red);
      }
    };


    var displayFrameworkInfo = function() {
      util.print('Framework'.blue.bold);
      var versions = getTemplateVersions();

      for (var i in versions) {
        util.print(leftIndent + util.returnWithSpace(i) + ':' + middleSpace + versions[i].grey);
      }
      util.print('');
    };

    var displayConnectionInfo = function() {
      util.print('Monaca cloud connection'.blue.bold);

      monaca.getConnectionInfo()
      .then(
        function(info) {
          util.print(leftIndent + util.returnWithSpace('status') + ':' + middleSpace + info['status'].green);
          util.print(leftIndent +'local ip        :' + middleSpace + ip.address().grey);
        },
        function(err) {
          util.print(leftIndent +'status          :' + middleSpace + 'not available'.red);
        }
      );
    };

    monaca.isCordovaProject(process.cwd())
    .then(
      function() {
        displayGlobal();
        displaySystem();
        displayFrameworkInfo();
        displayConnectionInfo();
      },
      function() {
        util.print('Not cordova project: missing project context'.yellow);
        displayGlobal();
        displaySystem();
        displayConnectionInfo();
      }
    )
    .then(
      monaca.reportFinish.bind(monaca, report),
      monaca.reportFail.bind(monaca, report)
    )
    .then(
      function() {
      }.bind(null),
      util.fail.bind(null, '\nSomething went wrong')
    );
  };

  module.exports = ConfigTask;
})();
