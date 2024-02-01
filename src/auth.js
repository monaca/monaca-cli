(function() {
'use strict';

var inquirer = require('inquirer'),
  path = require('path'),
  Q = require('q'),
  Monaca = require('monaca-lib').Monaca,
  Localkit = require('monaca-lib').Localkit,
  lib = require(path.join(__dirname, 'lib')),
  gTaskName = null,
  open = require('opn'),
  util = require(path.join(__dirname, 'util'));

var AuthTask = {}, monaca;

AuthTask.run = function(taskName, info) {
  monaca = new Monaca(info)
  gTaskName = taskName;
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
      mask: true,
      message: 'Enter your password:',
      validate: function(password) {
        passwordCheck = password;
        return password.length >= 6;
      }
    },
    {
      type: 'password',
      name: 'confirmPassword',
      mask: true,
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
  const report = {
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
      return lib.loginErrorHandler(error, gTaskName);
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
      util.warn('\nPlease finish the registration process and try login with command \'monaca login\'.');
      open('https://monaca.mobi/en/signup', {wait: false});
    }.bind(this)
  );
};

module.exports = AuthTask;
})();
