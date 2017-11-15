(function() {
'use strict';

var inquirer = require('monaca-inquirer'),
  path = require('path'),
  Q = require('q'),
  Monaca = require('monaca-lib').Monaca,
  Localkit = require('monaca-lib').Localkit,
  lib = require(path.join(__dirname, 'lib')),
  util = require(path.join(__dirname, 'util'));

var AuthTask = {}, monaca;

AuthTask.run = function(taskName, info) {
  monaca = new Monaca(info)
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
    function(result) {
      return this._confirmNewLogin(result)
      .then(
        this._performLogin.bind(this),
        util.err.bind(null)
      )
    }.bind(this),
    this._performLogin.bind(this)
  );
};

AuthTask._performLogin = function() {
  var report = {
    event: 'login'
  };
  monaca.reportAnalytics(report);

  util.print('Use "monaca signup" command if you need to create a new account.');
  util.print();

  return this.getCredentials(false)
  .then(
    function(credentials) {
      var pkg = require(path.join(__dirname, '..', 'package.json'));

      return monaca.login(credentials.email, credentials.password, {
        version: 'monaca-cli ' + pkg.version
      });
    }
  )
  .then(
    monaca.reportFinish.bind(monaca, report),
    monaca.reportFail.bind(monaca, report)
  )
  .then(
    function() {
      var user = monaca.loginBody;
      util.success('\nSuccessfully signed in as ' + user.username + '.');
    },
    function(error) {
      return lib.loginErrorHandler(error);
    }
  );
}


AuthTask._confirmNewLogin = function(data) {
  util.print('You are already signed in as ' + data.email.bold + '.');
  return inquirer.prompt({
    type: 'confirm',
    name: 'newLogin',
    message: 'Do you want to login with another account?',
    default: false
  }).then(function(answers) {
    return answers.newLogin ? this.logout() : Q.reject('Cancel');
  }.bind(this));
};

AuthTask.logout = function() {
  util.print('Signing out from Monaca Cloud...\n');

  var localkit = new Localkit(monaca);

  return monaca.logout()
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
    )
};

AuthTask.signup = function() {
  monaca.relogin().then(
    function() {
      util.print('You are signed in. Please sign out with \'monaca logout\' before creating a new account.');
    },
    function() {
      var report = {
        event: 'signup'
      };
      monaca.reportAnalytics(report);

      var credentials;
      this.getCredentials(true)
      .then(
        function(result) {
          credentials = result;
          var pkg = require(path.join(__dirname, '..', 'package.json'));

          return monaca.signup(credentials.email, credentials.password, credentials.confirmPassword, {
            version: 'monaca-cli ' + pkg.version
          });
        }
      )
      .then(
        monaca.reportFinish.bind(monaca, report),
        monaca.reportFail.bind(monaca, report)
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
                  monaca.reportAnalytics({
                    event: 'signup-complete'
                  })
                  .then(deferred.resolve.bind(deferred))
                }
              }, function(error) {
                if (error) {
                  clearInterval(intervalHandle);
                  deferred.reject(util.parseError(error) + '\nLooks like something went wrong. Plase try again later.');
                }
              });
          }, 3000);

          // Send "exit" event when program is terminated.
          process.on('SIGINT', function() {
            clearInterval(intervalHandle);
            process.exit(0);
          });

          return deferred.promise;
        }
      )
      .then(
        function() {
          util.success('Activation confirmed.');
          var pkg = require(path.join(__dirname, '..', 'package.json'));
          return monaca.login(credentials.email, credentials.password, {
            version: 'monaca-cli ' + pkg.version
          });
        },
        monaca.reportFail.bind(monaca, report)
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
