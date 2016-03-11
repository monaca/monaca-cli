(function() {
'use strict';

var path = require('path'),
  Q = require('q'),
  read = require('read'),
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

  var deferred = Q.defer();
  util.warn('This operation will overwrite all ' + (options.action === 'upload' ? 'remote changes that has been made.' : 'local changes you have made.'));
  read({
   prompt: 'Do you want to continue? [y/N] '
  }, function(error, answer) {
   if (error || answer.toLowerCase().charAt(0) !== 'y') {
     deferred.reject('Aborting operation.');
   } else {
     deferred.resolve();
   }
  });

  return deferred.promise;
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
      util.print('\nProject successfully ' + dict.verb + ' ' + dict.direction + ' Monaca Cloud!');
    } else {
      util.print('\nNo files ' + dict.verb + ' since project is already in sync.');
    }
  }
};

module.exports = {
  findProjectDir: findProjectDir,
  assureMonacaProject: assureMonacaProject,
  confirmOverwrite: confirmOverwrite,
  printSuccessMessage: printSuccessMessage
};
})();