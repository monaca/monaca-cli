(function() {
'use strict';

var path = require('path'),
  argv = require('optimist').argv,
  Monaca = require('monaca-lib').Monaca,
  Q = require('q'),
  lib = require(path.join(__dirname, 'lib')),
  util = require(path.join(__dirname, 'util'));

var ConfigTask = {}, monaca;

ConfigTask.run = function(taskName, info) {
  monaca = new Monaca(info);
  var command = argv._[1];

  if (taskName === 'proxy') {
    if (command === 'set' && argv._[2]) {
      this.setProxy(argv._[2]);
    } else if (command === 'rm' || command === 'remove') {
      this.removeProxy();
    } else {
      this.showProxy();
    }
  } else if (taskName === 'reconfigure') {
    this.reconfigure();
  }
};

ConfigTask.reconfigure = function() {
  var rawArgv = process.argv.slice(3)
  var report = {
    event: 'reconfigure',
    arg1: rawArgv
  };
  monaca.reportAnalytics(report);

  var projectDir = process.cwd();

  return lib.assureMonacaProject(projectDir, monaca)
    .then(function() {
      var promises = [];
      var dict = {
        transpile: 'generateBuildConfigs',
        components: 'initComponents',
        dependencies: 'installBuildDependencies'
      };

      Object.keys(dict).forEach(function(action) {
        if (rawArgv.length === 0 || argv[action]) {
          promises.push(monaca[dict[action]](projectDir));
        }
      });

      return Q.all(promises);
    })
    .then(
      monaca.reportFinish.bind(monaca, report),
      monaca.reportFail.bind(monaca, report)
    )
    .then(
      util.success.bind(null, '\nReconfiguration finished. '),
      util.fail.bind(null, '\nSomething went wrong during reconfiguration. ')
    );
};

ConfigTask.showProxy = function() {
  monaca.getConfig('http_proxy').then(
    function(proxyServer) {
      if (!proxyServer) {
        util.print('No proxy server configured. Set a proxy server with "monaca proxy set http://my.proxy.com:8080".');
      } else {
        util.print('Current proxy server is "' + proxyServer + '".');
      }
    },
    util.fail.bind(null, 'Unable to get configuration: ')
  );
};

ConfigTask.setProxy = function(proxyServer) {
  var report = {
    event: 'proxy'
  };

  monaca.setConfig('http_proxy', proxyServer)
  .then(
    monaca.reportAnalytics.bind(monaca, report),
    monaca.reportFail.bind(monaca, report)
  )
  .then(
    function(proxyServer) {
      util.success('Proxy server set to "' + proxyServer + '".');
    },
    util.fail.bind(null, 'Unable to set proxy server: ')
  );
};

ConfigTask.removeProxy = function() {
  monaca.removeConfig('http_proxy').then(
    function(proxyServer) {
      if (proxyServer) {
        util.print('Removed proxy server "' + proxyServer + '".');
      } else {
        util.print('No proxy server configured.');
      }
    },
    util.fail.bind(null, 'Unable to remove proxy server: ')
  );
};

module.exports = ConfigTask;
})();
