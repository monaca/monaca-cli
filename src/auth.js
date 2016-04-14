(function() {
'use strict';

var read = require('read'),
  path = require('path'),
  Q = require('q'),
  open = require('open'),
  Monaca = require('monaca-lib').Monaca,
  Localkit = require('monaca-lib').Localkit,
  util = require(path.join(__dirname, 'util'));

var monaca = new Monaca();

var AuthTask = {};

AuthTask.run = function(taskName) {
  if (taskName == 'login') {
    this.login();
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

AuthTask.getPassword = function() {
  var deferred = Q.defer();

  read({
    prompt: 'Password: ',
    silent: true
  }, function(error, password) {
    if (error) {
      deferred.reject(error);
    } else {
      deferred.resolve(password);
    }
  });

  return deferred.promise;
};

AuthTask.getCredentials = function() {
  var deferred = Q.defer();

  this.getEmail().then(
    function(email) {
      this.getPassword().then(
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
    }.bind(this),
    function(error) {
      deferred.reject('Unabled to get email.');
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
      this.getCredentials()
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
        function(error) {
          if (error === 'ECONNRESET') {
            util.print('Unable to connect to Monaca Cloud. Are you connected to the internet?').warn;
            util.print('If you need to use a proxy, please configure it with "monaca proxy".');
          } else {
            if (error.hasOwnProperty('code') && error.code == 503) {
              if (error.hasOwnProperty('result') && error.result.hasOwnProperty('confirm') && error.result.confirm) {
                util.warn(error);
                read({
                  prompt: ' [Y/n]:'
                }, function(err, answer) {
                  if (answer.toLowerCase().charAt(0) !== 'n') {
                    if (error.result.hasOwnProperty('redirect')) {
                      open(error.result.redirect);
                    }
                  }
                });
              } else {
                util.warn(error);
                if (error.hasOwnProperty('result') && error.result.hasOwnProperty('redirect')) {
                  read({
                    prompt: 'Press Enter to continue...'
                  }, function() {
                    open(error.result.redirect);
                  });
                }
              }
            } else if (error.hasOwnProperty('code') && error.code == 402) {
              util.err('Your Monaca CLI evaluation period has expired. Please upgrade the plan to continue.');
              read({
                prompt: 'Press Enter to display upgrade page.'
              }, function(err, answer) {
                open('https://monaca.mobi/plan/change');
              });
            } else {
              util.err('Unable to sign in: ', error);
              util.print('If you don\'t yet have a Monaca account, please sign up at https://monaca.mobi/en/register/start .');
            }
          }
        }
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

module.exports = AuthTask;
})();
