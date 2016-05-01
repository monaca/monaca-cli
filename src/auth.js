(function() {
'use strict';

var inquirer = require('inquirer'),
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
    return this.login();
  } else if (taskName === 'signup') {
    this.signup();
  } else {
    this.logout();
  }
};

AuthTask.getCredentials = function(doubleCheck) {
  var passwordCheck;
  var emailValidation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var paramEmail = emailValidation.test(process.argv[3]) ? process.argv[3] : null;

  return inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Enter your email address:',
      when: !paramEmail,
      validate: function(email) {
        return emailValidation.test(email);
      }
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter your password:',
      validate: function(password) {
        passwordCheck = password;
        return password.length >= 6;
      }
    },
    {
      type: 'password',
      name: 'confirmPassword',
      message: 'Confirm your password:',
      when: !!doubleCheck,
      validate: function(confirmPassword) {
        return confirmPassword.length >= 6 && confirmPassword === passwordCheck;
      }

    }
  ]).then(function(answers) {
    !paramEmail || (answers.email = paramEmail);
    return answers;
  });
};

AuthTask.login = function() {
  return monaca.relogin().then(
    function() {
      util.print('You are already signed in. Please sign out with \'monaca logout\' in order to sign in with another user.');
    },
    function() {
      util.print('Use "monaca signup" command if you need to sign up.');
      util.print();
      return this.getCredentials(false)
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
          return lib.loginErrorHandler(error);
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
      util.fail.bind(null, 'Unable to sign out: ')
    )
    .then(
      util.print.bind(null, 'Removed Monaca Debugger pairing information.'),
      util.fail.bind(null, 'Unable to remove Monaca Debugger pairing information: ')
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
