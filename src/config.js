(function() {
  'use strict';

  var path = require('path'),
    argv = require('optimist').argv,
    Monaca = require('monaca-lib').Monaca,
    util = require(path.join(__dirname, 'util'));

  var monaca = new Monaca();

  var BaseTask = require(path.join(__dirname, 'task')).BaseTask;

  var ConfigTask = function(){};

  ConfigTask.prototype = new BaseTask();

  ConfigTask.prototype.taskList = {
    'proxy': {
      description: 'configure proxy to use when connecting to Monaca Cloud',
      longDescription: [
        'Configure a proxy server.',
        '',
        'The proxy server is defined as "http://my.proxy.com:8080".' 
      ],
      usage: ['monaca proxy'],
      examples: [
        'monaca proxy set http://my.proxy.com:8080',
        'monaca proxy rm'
      ]
    }
  };

  ConfigTask.prototype.run = function(taskName){
    if (!this.isMyTask(taskName)) {
      return;
    }

    var command = argv._[1];

    if (command === 'set' && argv._[2]) {
      this.setProxy(argv._[2]);
    }
    else if (command === 'rm' || command === 'remove') {
      this.removeProxy();
    }
    else {
      this.showProxy();
    }
  };

  ConfigTask.prototype.showProxy = function() {
    monaca.getConfig('http_proxy').then(
      function(proxyServer) {
        if (!proxyServer) {
          util.print('No proxy server configured. Set a proxy server with "monaca proxy set http://my.proxy.com:8080".');
        }
        else {
          util.print('Current proxy server is "' + proxyServer + '".');
        }
      },
      function(error) {
        util.err('Unable to get configuration: ' + error);
        process.exit(1);
      }
    );
  };

  ConfigTask.prototype.setProxy = function(proxyServer) {
    monaca.setConfig('http_proxy', proxyServer).then(
      function(proxyServer) {
        util.print('Proxy server set to "' + proxyServer + '".');
      },
      function(error) {
        util.err('Unable to set proxy server: ' + error);
        process.exit(1);
      }
    );
  };

  ConfigTask.prototype.removeProxy = function() {
    monaca.removeConfig('http_proxy').then(
      function(proxyServer) {
        if (proxyServer) {
          util.print('Removed proxy server "' + proxyServer + '".');
        }
        else {
          util.print('No proxy server configured.');
        }
      },
      function(error) {
        util.err('Unable to remove proxy server: ' + error);
        process.exit(1);
      }
    );
  };

  exports.ConfigTask = ConfigTask;
})();
