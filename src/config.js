(function() {
'use strict';

var path = require('path'),
  argv = require('optimist').argv,
  Monaca = require('monaca-lib').Monaca,
  util = require(path.join(__dirname, 'util'));

var monaca = new Monaca();

var ConfigTask = {};

ConfigTask.run = function(taskName) {
  var command = argv._[1];

  if (command === 'set' && argv._[2]) {
    this.setProxy(argv._[2]);
  } else if (command === 'rm' || command === 'remove') {
    this.removeProxy();
  } else {
    this.showProxy();
  }
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
  monaca.setConfig('http_proxy', proxyServer).then(
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
