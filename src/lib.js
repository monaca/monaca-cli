(function() {
'use strict';

var path = require('path'),
  Q = require('q'),
  open = require('open'),
  inquirer = require('inquirer'),
  util = require(path.join(__dirname, 'util'));

var findProjectDir = function(cwd, monaca) {
  return monaca.isMonacaProject(cwd).then(
    function() {
      return Q.resolve(cwd);
    },
    function(error) {
      var newPath = path.join(cwd, '..');
      return newPath === cwd ? Q.reject('Directory is not a Monaca project.') : findProjectDir(newPath, monaca);
    }
  );
};

var assureMonacaProject = function(cwd, monaca) {
  var deferred = Q.defer(),
    resolve = deferred.resolve.bind(deferred),
    reject = deferred.reject.bind(deferred);

  monaca.getProjectId(cwd)
    .then(
      function(projectId) {
        if (typeof projectId === 'undefined') {
          return Q.reject();
        } else {
          return projectId;
        }
      },
      util.fail
    )
    .then(
      function(projectId) {
        resolve({
          projectId: projectId
        });
      },
      function(error) {
        monaca.getProjectInfo(cwd)
          .then(
            function(info) {
              return monaca.createProject({
                name: info.name,
                description: info.description,
                templateId: 'minimum'
              });
            },
            reject
          )
          .then(
            function(info) {
              return monaca.setProjectId(cwd, info.projectId)
                .then(resolve.bind(null, info), reject);
            },
            reject
          );
      }
    );

  return deferred.promise;
};

// Prompts a confirmation before overwriting files.
var confirmOverwrite = function(options) {
  // If --dry-run or --force option is used then no need to show warning message to user.
  if (options.dryrun || options.force) {
   return Q.resolve();
  }

  util.warn('This operation will overwrite all ' + (options.action === 'upload' ? 'remote changes that has been made.' : 'local changes you have made.'));
  return inquirer.prompt({
    type: 'confirm',
    name: 'overwrite',
    message: 'Do you want to continue?',
    default: false
  }).then(function(answers) {
    return answers.overwrite ? Q.resolve() : Q.reject();
  });
};

// Prints the success message.
var printSuccessMessage = function(options, files) {
  var dict = {verb: 'uploaded', files: 'uploaded', direction: 'to', target: 'on Monaca Cloud'};
  if (options.action === 'download') {
    dict = {verb: 'downloaded', files: 'remoteFiles', direction: 'from', target: 'locally'};
  }

  if (options.dryrun && !options.force) {

    if (files && Object.keys(files[dict.files]).length > 0) {
      util.print('Following files will be ' + dict.verb + ':');
      util.displayObjectKeys(files[dict.files]);
    } else {
      util.print('No files will be ' + dict.verb + ' since project is already in sync.');
    }

    if (options.delete) {
      if (files && Object.keys(files.deleted).length > 0) {
        util.print('\nFollowing files will be deleted ' + dict.target + ':');
        util.displayObjectKeys(files.deleted);
      } else {
        util.print('\nNo files will be deleted ' + dict.target + '.');
      }
    }

  } else {

    if (files && Object.keys(files[dict.files]).length > 0) {
      util.success('\nProject successfully ' + dict.verb + ' ' + dict.direction + ' Monaca Cloud!');
    } else {
      util.print('\nNo files ' + dict.verb + ' since project is already in sync.');
    }
  }
};

var loginErrorHandler = function (error) {
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
      util.print('If you don\'t yet have a Monaca account, please sign up using \'monaca signup\'.');
    }
  }
};

module.exports = {
  findProjectDir: findProjectDir,
  assureMonacaProject: assureMonacaProject,
  confirmOverwrite: confirmOverwrite,
  printSuccessMessage: printSuccessMessage,
  loginErrorHandler: loginErrorHandler
};
})();
