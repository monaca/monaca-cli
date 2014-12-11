(function() {
  'use strict';

  var read = require('read'),
    path = require('path'),
    Q = require('q'),
    Monaca = require('monaca-lib').Monaca;

  var util = require(path.join(__dirname, 'util'));
    
  var monaca = new Monaca();

  var BaseTask = require('./task').BaseTask;

  var SyncTask = function(){};

  SyncTask.prototype = new BaseTask();

  SyncTask.prototype.taskList = ['upload', 'download'];

  SyncTask.prototype.run = function(taskName){
    var self = this;

    if (!this.isMyTask(taskName)) 
      return;

    monaca.relogin().then(
      function() {
        if (taskName == 'upload') {
          self.upload();
        }
        else {
          self.download();
        }
      },
      function() {
        util.err('Must be signed in to use this command.')
        util.print('Please sign in with \'monaca login\' to sign in.');
      }
    );
  };

  SyncTask.prototype.upload = function() {
    var nbrOfFiles = 0;

    monaca.uploadProject(process.cwd()).then(
      function() {
        if (nbrOfFiles === 0) {
          util.print('No files uploaded since project is already in sync.');
        }
        else {
          util.print('Project successfully uploaded to Monaca Cloud!');
        }
      },
      function(error) {
        util.err('Upload failed: ' + error);
      },
      function(progress) {
        var per = 100 * (progress.index + 1) / progress.total;
        per = per.toString().substr(0, 5) + '%';
        console.log(('[' + per + ']').verbose + ' Uploading ' + progress.path);

        nbrOfFiles++;
      }
    );
  };

  SyncTask.prototype.download = function() {
    var nbrOfFiles = 0;

    monaca.downloadProject(process.cwd()).then(
      function() {
        if (nbrOfFiles === 0) {
          util.print('No files downloaded since project is already in sync.');
        }
        else {
          util.print('Project successfully downloaded from Monaca Cloud!');
        }
      },
      function(error) {
        util.err('Download failed: ' + error);
      },
      function(progress) {
        var per = 100 * (progress.index + 1) / progress.total;
        per = per.toString().substr(0, 5) + '%';
        console.log(('[' + per + ']').verbose + ' Downloading ' + progress.path);

        nbrOfFiles++;
      }
    );
  };

  exports.SyncTask = SyncTask;
})();
