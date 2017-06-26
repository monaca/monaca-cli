(function() {
  'use strict';

  var path = require('path'),
    Monaca = require('monaca-lib').Monaca,
    util = require(path.join(__dirname, 'util')),
    os = require('os'),
    compareVersions = require('compare-versions'),
    ip = require('ip'),
    npm = require('global-npm'),
    fs = require('fs'),
    Q = require('q');

  var ConfigTask = {}, monaca;

  ConfigTask.run = function(taskName, info) {
    monaca = new Monaca(info);

    this.showInfo(info);
  };

  ConfigTask.showInfo = function(info) {
    var report = {
      event: 'info'
    };

    monaca.reportAnalytics(report);

    var fileExists = function(filePath) {
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
      var libDir = path.join(process.cwd(), 'www', 'lib');

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

      if (fileExists(path.join(process.cwd(), '.monaca','project_info.json'))) {
        result.cordova = require(path.join(process.cwd(), '.monaca','project_info.json'))['cordova_version'];
      }

      for (var i in onsenPaths) {
        if (fileExists(onsenPaths[i])) {
          result.onsenui = require(onsenPaths[i]).version;
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
      util.success('Systemn\n');
      try {
        var os = getOperatingSystem(),
          nodeVersion = process.versions.node,
          npmVersion = npm.version;

        if (os) {
          util.print(util.alignContent('os') + os.grey);
        }
        if (nodeVersion) {
          util.print(util.alignContent('node') + nodeVersion.grey);
        }
        if (npmVersion) {
          util.print(util.alignContent('npm') + npmVersion.grey + '\n');
        }
      } catch (err) {
        util.err('Failed displaying system info: ' + err);
      }
    };

    var displayMonacaInfo = function() {
      try {
        var cliPackage = require(path.join(__dirname, '..', 'package.json'));
        util.success('\nMonaca dependencies\n');
        util.print(util.alignContent('monaca-lib') + cliPackage.dependencies['monaca-lib'].grey);
        util.print(util.alignContent('monaca-cli') + info.clientVersion.grey + '\n');
      } catch (err) {
        util.err('Failed displaying monaca info: ' + err);
      }
    };


    var displayProjectInfo = function() {
      util.success('Project info\n');
      var versions = getTemplateVersions();

      for (var i in versions) {
        util.print(util.alignContent(i) + versions[i].grey);
      }
      util.print('');
    };

    var displayConnectionInfo = function() {
      util.success('Monaca cloud connection\n');
      util.print(util.alignContent('local ip') + ip.address().grey);
      return monaca.getConnectionStatus()
      .then(
        function(status) {
          util.print(util.alignContent('status') + status.grey + '\n');
          return Q.resolve();
        }
      );
    };


    displayMonacaInfo();
    displaySystem();

    displayConnectionInfo()
    .then(
      function() {
        return monaca.isCordovaProject(process.cwd());
      }
    )
    .then(
      function() {
        displayProjectInfo();
        monaca.reportFinish.bind(monaca, report);
      },
      monaca.reportFail.bind(monaca, report)
    );
  };

  module.exports = ConfigTask;
})();
