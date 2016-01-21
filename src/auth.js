(function() {
  'use strict';

  var read = require('read'),
    path = require('path'),
    Q = require('q'),
    open = require('open'),
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
      options: [
        ['email', 'Email address used to login Monaca']
      ],
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
    if (!this.isMyTask(taskName)) {
      return;
    }

    if (taskName == 'login') {
      this.login();
    }
    else {
      this.logout();
    }
  };

  AuthTask.prototype.getEmail = function() {
    var deferred = Q.defer();

    if (process.argv[3]) {
      deferred.resolve(process.argv[3]);
    } else {
      read({ prompt: 'Email address: ' }, function(error, email) {
        if (error) {
          deferred.reject(error);
        }
        else {
          deferred.resolve(email);
        }
      });
    }

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
            var pkg = require(path.join(__dirname, '..', 'package.json'));

            monaca.login(credentials.email, credentials.password, {version: 'monaca-cli ' + pkg.version}).then(
              function() {
                var user = monaca.loginBody;
                if (user.hasOwnProperty("localkitEvaluationDays")) {
                  // Under evaluation period
                  util.warn('Monaca CLI is under the evaluation period. It will expire in ' + user.localkitEvaluationDays + ' days.');
                  util.warn('You need to upgrade the plan when the evaluation period ends.')
                }
                util.print('Successfully signed in as ' + user.username + '.');
              },
              function(error) {
                if (error === 'ECONNRESET') {
                  util.print('Unable to connect to Monaca Cloud. Are you connected to the internet?').warn;
                  util.print('If you need to use a proxy, please configure it with "monaca proxy".');
                }
                else {
                  if (error.hasOwnProperty("code") && error.code == 503) {
                    if (error.hasOwnProperty("result") && error.result.hasOwnProperty("confirm") && error.result.confirm) {
                      util.warn(error.message);
                      read({ prompt: ' [Y/n]:' }, function(err, answer) {
                        if (answer.toLowerCase().charAt(0) !== 'n') {
                          if (error.result.hasOwnProperty("redirect")) {
                            open(error.result.redirect);
                          }
                        }
                      });
                    } else {
                      util.warn(error.message);
                      if (error.hasOwnProperty("result") && error.result.hasOwnProperty("redirect")) {
                        read({ prompt: 'Press Enter to continue...' }, function() {
                          open(error.result.redirect);
                        });
                      }
                    }
                  } else if (error.hasOwnProperty("code") && error.code == 402) {
                    util.err("Your Monaca CLI evaluation period has expired. Please upgrade the plan to continue.");
                    read({ prompt: 'Press Enter to display upgrade page.' }, function(err, answer) {
                      open("https://monaca.mobi/plan/change");
                    });
                  } else {
                    util.err('Unable to sign in: ' + error.message);
                    util.print('If you don\'t yet have a Monaca account, please sign up at https://monaca.mobi/en/register/start .');
                  }
                }
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
        util.err('Unable to sign out: ' + error);
      }
    )
    .then(
      function() {
        util.print('Removed Monaca Debugger pairing information.');
      },
      function(error) {
        util.err('Unable to remove Monaca Debugger pairing information: ' + error);
      }
    )
    .finally(
      function() {
        process.exit(0);
      }
    );
  };

  exports.AuthTask = AuthTask;
})();
