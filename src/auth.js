(function() {
'use strict';

var read = require('read'),
  path = require('path'),
  Q = require('q'),
  Monaca = require('monaca-lib').Monaca,
  Localkit = require('monaca-lib').Localkit,
  lib = require(path.join(__dirname, 'lib')),
  util = require(path.join(__dirname, 'util'));

var monaca = new Monaca();

var AuthTask = {};

AuthTask.run = function(taskName) {
  if (taskName == 'login') {
    this.login();
  } else if (taskName === 'signup') {
    this.signup();
  } else {
    this.logout();
  }
};

AuthTask.getEmail = function() {
  var deferred = Q.defer();

  if (process.argv[3]) {
    deferred.resolve(process.argv[3]);
  } else {
    read({
      prompt: 'Email address: '
    }, function(error, email) {
      if (error) {
        deferred.reject(error);
      } else {
        deferred.resolve(email);
      }
    });
  }

  return deferred.promise;
};

AuthTask.getPassword = function(doubleCheck) {
  var deferred = Q.defer();

  read({
    prompt: 'Password: ',
    silent: true
  }, function(error, password) {
    if (error) {
      deferred.reject(error);
    } else {
      if (doubleCheck) {
        read({
          prompt: 'Confirm password: ',
          silent: true
        }, function(error, confirmPassword) {
          if (error) {
            deferred.reject(error);
          } else {
            if (password === confirmPassword) {
              deferred.resolve([password, confirmPassword]);
            } else {
              deferred.reject('Password does not match.');
            }
          }
        });
      } else {
        deferred.resolve([password]);
      }
    }
  });

  return deferred.promise;
};

AuthTask.getCredentials = function(doubleCheck) {
  var deferred = Q.defer();

  this.getEmail().then(
    function(email) {
      this.getPassword(doubleCheck).then(
        function(password) {
          deferred.resolve({
            email: email,
            password: password[0],
            confirmPassword: password[1]
          });
        },
        function(error) {
          deferred.reject(error);
        }
      );
    }.bind(this),
    function(error) {
      deferred.reject(error);
    }
  );

  return deferred.promise;
};

AuthTask.login = function() {
  monaca.relogin().then(
    function() {
      util.print('You are already signed in. Please sign out with \'monaca logout\' in order to sign in with another user.');
    },
    function() {
      this.getCredentials(false)
      .then(
        function(credentials) {
          var pkg = require(path.join(__dirname, '..', 'package.json'));

          return monaca.login(credentials.email, credentials.password, {
            version: 'monaca-cli ' + pkg.version
          });
        },
        util.fail
      )
      .then(
        function() {
          var user = monaca.loginBody;
          if (user.hasOwnProperty('localkitEvaluationDays')) {
            // Under evaluation period.
            util.warn('Monaca CLI is under the evaluation period. It will expire in ' + user.localkitEvaluationDays + ' days.');
            util.warn('You need to upgrade the plan when the evaluation period ends.');
          }
          util.success('\nSuccessfully signed in as ' + user.username + '.');
        },
        lib.loginErrorHandler
      )
      ;
    }.bind(this)
  );
};

AuthTask.logout = function() {
  util.print('Signing out from Monaca Cloud...\n');

  var localkit = new Localkit(monaca);

  monaca.logout()
    .then(
      function() {
        util.print('You have been signed out.');
        return localkit.clearPairing();
      },
      util.err.bind(null, 'Unable to sign out: ')
    )
    .then(
      util.print.bind(null, 'Removed Monaca Debugger pairing information.'),
      util.err.bind(null, 'Unable to remove Monaca Debugger pairing information: ')
    );
};

AuthTask.signup = function() {
  monaca.relogin().then(
    function() {
      util.print('You are signed in. Please sign out with \'monaca logout\' before creating a new account.');
    },
    function() {
      var credentials;
      this.getCredentials(true)
      .then(
        function(result) {
          credentials = result;
          var pkg = require(path.join(__dirname, '..', 'package.json'));

          return monaca.signup(credentials.email, credentials.password, credentials.confirmPassword, {
            version: 'monaca-cli ' + pkg.version
          });
        },
        util.fail
      )
      .then(
        function(token) {
          util.print('\nThanks for sign up!');
          util.print('You should get a confirmation email in your inbox. Please open the email and click the link inside.');
          util.print('Waiting for the sign up to complete...'.help);

          var deferred = Q.defer();

          var intervalHandle = setInterval(function() {
            monaca.isActivatedUser(token)
              .then(function() {
                if (deferred.promise.inspect().state === 'pending') {
                  clearInterval(intervalHandle);
                  deferred.resolve();
                }
              }, function(error) {
                if (error) {
                  clearInterval(intervalHandle);
                  util.fail(error, '\nLooks like something went wrong. Plase try again later.');
                }
              });
          }, 3000);

          // Send "exit" event when program is terminated.
          process.on('SIGINT', function() {
            clearInterval(intervalHandle);
            process.exit(0);
          });

          return deferred.promise;
        },
        util.fail
      )
      .then(
        function() {
          util.success('Activation confirmed.');
          var pkg = require(path.join(__dirname, '..', 'package.json'));
          return monaca.login(credentials.email, credentials.password, {
            version: 'monaca-cli ' + pkg.version
          });
        },
        util.fail
      )
      .then(
        function() {
          var user = monaca.loginBody;
          util.success('You are now logged in as ' + user.username + '.');
        },
        lib.loginErrorHandler
      )
      ;
    }.bind(this)
  );
};

module.exports = AuthTask;
})();
