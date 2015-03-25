(function() {
  'use strict';

  var read = require('read'),
    path = require('path'),
    open = require('open'),
    Q = require('q'),
    qrcode = require('qrcode-npm'),
    argv = require('optimist').argv,
    Monaca = require('monaca-lib').Monaca,
    util = require(path.join(__dirname, 'util'));

  var monaca = new Monaca();

  var BaseTask = require(path.join(__dirname, 'task')).BaseTask;

  var RemoteTask = function(){};

  RemoteTask.prototype = new BaseTask();

  RemoteTask.prototype.taskList = {
    'remote build': {
      description: 'build project on Monaca Cloud',
      longDescription: [
        'Build the project on Monaca Cloud.',
        '',
        'Don\'t forget to upload the latest project before building',
        'using `monaca upload`.'
      ],
      usage: ['monaca remote build'],
      options: [
        ['--debugger', 'build the custom debugger']
      ],
      examples: [
        'monaca remote build',
        'monaca remote build --debugger'
      ]
    }
  };

  RemoteTask.prototype.run = function(taskName){
    var self = this;

    if (!this.isMyTask(taskName)) 
      return;

    monaca.relogin().then(
      function() {
        var task = argv._[1];

        if (task === 'build') {
          self.build();
        }
        else {
          util.err('No such command.');
          process.exit(1);
        }
      },
      function() {
        util.err('Must be signed in to use this command.');
        util.print('Please sign in with \'monaca login\'.');
        util.print('If you don\'t have an account yet you can create one at https://monaca.mobi/en/register/start');
        process.exit(1);
      }
    );
  };

  RemoteTask.prototype.build = function() {
    monaca.getProjectId(process.cwd()).then(
      function(projectId) {
        var url = 'https://ide.monaca.mobi/project/' + projectId + '/' + (argv.debugger ? 'debugger' : 'build');

        return monaca.getSessionUrl(url);
      },
      function(error) {
        util.err('This is not a Monaca project.');
        process.exit(1);
      }
    )
    .then(
      function(url) {
        open(url);
      },
      function(error) {
        util.err('Unable to open build page.');
        process.exit(1);
      }
    );
  };

  exports.RemoteTask = RemoteTask;
})();
