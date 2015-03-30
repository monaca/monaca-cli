(function() {
  'use strict';

  var read = require('read'),
    path = require('path'),
    Q = require('q'),
    Monaca = require('monaca-lib').Monaca,
    Localkit = require('monaca-lib').Localkit;

  var util = require(path.join(__dirname, 'util'));

  var monaca = new Monaca();

  var BaseTask = require(path.join(__dirname, 'task')).BaseTask;

  var AuthTask = function(){};

  AuthTask.prototype = new BaseTask();

  AuthTask.prototype.taskList = {
    login: {
      description: 'sign in to Monaca Cloud',
      usage: 'monaca login',
      longDescription: 'Sign in to the Monaca Cloud. Will display a prompt that asks for user credentials.',
      examples: ['monaca login']
    },
    logout: {
      description: 'sign out from Monaca Cloud',
      usage: 'monaca logout',
      longDescription: 'Sign out from Monaca Cloud. Will remote stored login token.',
      examples: ['monaca logout']
    }
  };

  AuthTask.prototype.run = function(taskName){
    if (!this.isMyTask(taskName)) 
      return;

    if (taskName == 'login') {
      this.login();
    }
    else {
      this.logout();
    }
  };

  AuthTask.prototype.getEmail = function() {
    var deferred = Q.defer();

    read({ prompt: 'Email address: ' }, function(error, email) {
      if (error) {
        deferred.reject(error);
      }
      else {
        deferred.resolve(email);
      }
    });

    return deferred.promise;
  };

  AuthTask.prototype.getPassword = function() {
    var deferred = Q.defer();

    read({ prompt: 'Password: ', silent: true }, function(error, password) {
      if (error) {
        deferred.reject(error);
      }
      else {
        deferred.resolve(password);
      }
    });

    return deferred.promise;
  };

  AuthTask.prototype.getCredentials = function() {
    var deferred = Q.defer(),
      self = this;

    self.getEmail().then(
      function(email) {
        self.getPassword().then(
          function(password) {
            deferred.resolve({
              email: email,
              password: password
            });
          },
          function(error) {
            deferred.reject('Unable to get password.');
          }
        );
      },
      function(error) {
        deferred.reject('Unabled to get email.');
      }
    );

    return deferred.promise;
  };

  AuthTask.prototype.login = function() {
    var self = this;

    monaca.relogin().then(
      function() {
        util.print('You are already signed in. Please sign out with \'monaca logout\' in order to sign in with another user.');
      },
      function() {
        self.getCredentials().then(
          function(credentials) {
            monaca.login(credentials.email, credentials.password).then(
              function() {
                util.print('Successfully signed in as ' + credentials.email + '.');
              },
              function(error) {
                util.err('Unable to sign in: ' + error);
                util.print('If you don\'t yet have a Monaca account, please sign up at https://monaca.mobi/en/register/start .');
              }
            );
          },
          function(error) {
            util.err('Unable to get credentials: ' + error);
          }
        );
      }
    );
  };

  AuthTask.prototype.logout = function() {
    process.stdout.write('Signing out from Monaca Cloud...\n');

    var localkit = new Localkit(monaca);

    monaca.logout().then(
      function() {
        process.stdout.write('You have been signed out.\n');

        return localkit.clearPairing();
      },
      function(error) {
        process.stderr.write('Unable to sign out: ' + error);
      }
    )
    .then(
      function() {
        util.print('Removed Monaca Debugger pairing information.');
      },
      function(error) {
        util.err('Unable to remove Monaca Debugger pairing information: ' + error);
      }
    );
  };

  exports.AuthTask = AuthTask;
})();
