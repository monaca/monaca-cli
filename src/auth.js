(function() {
'use strict';

var inquirer = require('inquirer'),
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
              util.err('\nUnable to sign in: ', error);
              util.print('If you don\'t yet have a Monaca account, please sign up with \'monaca signup\' or visit https://monaca.mobi/en/register/start .');
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
      util.fail.bind(null, 'Unable to sign out: ')
    )
    .then(
      util.print.bind(null, 'Removed Monaca Debugger pairing information.'),
      util.fail.bind(null, 'Unable to remove Monaca Debugger pairing information: ')
    );
};

module.exports = AuthTask;
})();
