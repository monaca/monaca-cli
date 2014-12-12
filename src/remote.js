(function() {
  'use strict';

  var read = require('read'),
    path = require('path'),
    open = require('open'),
    Q = require('q'),
    qrcode = require('qrcode-npm'),
    argv = require('optimist').argv,
    Monaca = require('monaca-lib').Monaca;

  var util = require(path.join(__dirname, 'util'));
    
  var monaca = new Monaca();

  var BaseTask = require('./task').BaseTask;

  var RemoteTask = function(){};

  RemoteTask.prototype = new BaseTask();

  RemoteTask.prototype.taskList = {
    'remote build': {
      description: 'remote tasks'
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
        util.err('Must be signed in to use this command.')
        util.print('Please sign in with \'monaca login\'.');
        util.print('If you don\'t have an account yet you can create one at https://monaca.mobi/en/register/start');
        process.exit(1);
      }
    );
  };

  RemoteTask.prototype.build = function() {
    if (argv.debugger) {
      util.print('Redirecting to debugger build page...');
      monaca.getProjects().then(
        function(projects) {
          var projectId = projects[0].projectId;

          open('https://ide.monaca.mobi/project/' + projectId + '/debugger');
        },
        function(error) {
          util.err('An error has occurred.');
        }
      );
    }
    else {
      util.print('Uploading project to the Monaca Cloud.');
      monaca.uploadProject(process.cwd()).then(
        function(projectId) {
          util.print('Project successfully uploaded. Redirecting to build page...');
          open('https://ide.monaca.mobi/project/' + projectId + '/build');
        },
        function(error) {
          util.err('Upload failed: ' + error);
        },
        function(progress) {
          var per = 100 * (progress.index + 1) / progress.total;
          per = per.toString().substr(0, 5) + '%';
          util.print(('[' + per + '] ').verbose + progress.path);
        }
      );
    }
  };

  RemoteTask.prototype._createQrCode = function(url) {
    var code = qrcode.qrcode(8, 'M'),
    blockChar = String.fromCharCode(9608),
    block = blockChar + blockChar;

    code.addData(url);
    code.make();

    var str = '',
      i, j,
      margin = 2;

    for (i = 0; i < margin; i++) {
      for (j = 0; j < code.getModuleCount() + 2 * margin; j++) {
        str += block.white;        
      }
      str += '\n';
    }

    for (i = 0; i < code.getModuleCount(); i++) {
      for (j = 0; j < margin; j++) {
        str += block.white;
      }
      
      for (j = 0; j < code.getModuleCount(); j++) {
        if (code.isDark(i, j)) {
          str += block.black;
        }
        else {
          str += block.white;
        }
      }

      for (j = 0; j < margin; j++) {
        str += block.white;
      }

      str += '\n';
    }

    for (i = 0; i < margin; i++) {
      for (j = 0; j < code.getModuleCount() + 2 * margin; j++) {
        str += block.white;        
      }
      str += '\n';
    }

    return str;
  };

  RemoteTask.prototype.buildAndroid = function() {
    var self = this;

    var params = {
      platform: 'android'
    };

    self._uploadAndBuild(params).then(
      function(result) {
        var url = result.binary_url;
        util.print(url);
        util.print(self._createQrCode(url));
      },
      function(error) {
        util.err('Build failed: ' + error);
        process.exit(1);
      }
    );
  };

  exports.RemoteTask = RemoteTask;
})();
