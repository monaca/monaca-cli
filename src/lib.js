(function() {
'use strict';

var path = require('path'),
  Q = require('q'),
  open = require('open'),
  inquirer = require('monaca-inquirer'),
  fs = require('fs'),
  util = require(path.join(__dirname, 'util')),
  terminal = require(path.join(__dirname, 'terminal'));

var VERSION = require(path.join(__dirname, '..', 'package.json')).version;

var findProjectDir = function(cwd, monaca) {
  return monaca.isMonacaProject(cwd).then(
    function() {
      return Q.resolve(cwd);
    },
    function(error) {
      var newPath = path.join(cwd, '..');
      return newPath === cwd ? Q.reject("Directory is not a Monaca project: 'config.xml' file or 'www' folder may be missing.\nPlease visit http://docs.monaca.io/en/monaca_cli/manual/troubleshooting/#incomplete-files-and-folder-structure") : findProjectDir(newPath, monaca);
    }
  );
};

var softlyAssureMonacaProject = function(cwd) {
  var projectConfig;

  try {
     projectConfig = require(path.resolve(cwd, 'package.json'));
  } catch (err) {}

  if (projectConfig && projectConfig.dependencies && projectConfig.dependencies['react-native']) {
    return 'react-native';
  } else if (fs.existsSync(path.resolve(cwd, 'www')) && fs.existsSync(path.join(cwd, 'config.xml'))) {
    return 'cordova';
  } else {
    var next = path.resolve(cwd, '..');

    if (next !== cwd) {
      return softlyAssureMonacaProject(next);
    } else {
      return false;
    }
  }
};

var assureMonacaProject = function(cwd, monaca) {
  var framework;

  return monaca.isMonacaProject(cwd)
  .then(
    function(projectFramework) {
      framework = projectFramework;

      return monaca.getProjectId(cwd);
    })
    .then(
      function(projectId) {
        if (typeof projectId === 'undefined') {
          return Q.reject();
        } else {
          return projectId;
        }
      }
    )
    .then(
      function(projectId) {
        return Q.resolve({
          projectId: projectId,
          framework: framework
        });
      },
      function(error) {
        if (error) {
          return Q.reject(error);
        }

        return monaca.getProjectInfo(cwd, framework)
          .then(
            function(info) {
              return monaca.createProject({
                name: info.name,
                description: info.description,
                templateId: 'minimum',
                framework: framework
              });
            }
          )
          .then(
            function(info) {
              return monaca.setProjectId(cwd, info.projectId)
                .then(Q.resolve.bind(null, info), Q.reject);
            }
          );
      }
    );
};

// Prompts a confirmation before overwriting files.
var confirmOverwrite = function(options) {
  // If --dry-run or --force option is used then no need to show warning message to user.
  if (options.dryrun || options.force) {
   return Q.resolve();
  }

  util.warn('This operation will overwrite all the ' + (options.action === 'upload' ? 'remote changes that have been made.' : 'local changes you have made.'));
  return inquirer.prompt({
    type: 'confirm',
    name: 'overwrite',
    message: 'Do you want to continue?',
    default: false
  }).then(function(answers) {
    return answers.overwrite ? Q.resolve() : Q.reject('Cancel');
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
      util.err();
      util.err('Unable to sign in: ', error);
      return {
        nextTask: {
          set: 'auth',
          name: 'login'
        }
      };
    }
  }
};

var printVersion = function() {
  util.print(VERSION.info.bold);
};

var printLogo = function() {
  var logoFile = path.join(__dirname, '..', 'doc', 'logo.txt'),
    logo = fs.readFileSync(logoFile).toString();

  util.print(logo.bold.blue);
  util.print(' Command Line Interface for Monaca and Onsen UI');
  util.print(' Monaca CLI Version ' + VERSION + '\n');
};

var printUsage = function() {
  util.print('Usage: monaca command [args]\n');
};

var printCommands = function(taskList) {
  util.print('Commands: (use --help to show all)\n');

  var taskMaxLength = 0;
  var tasks = Object.keys(taskList)
    .map(function(taskSet) {
      return Object.keys(taskList[taskSet]).map(function(taskName) {
        var task = taskList[taskSet][taskName]
        if (task.showInHelp !== false) {
          taskMaxLength = Math.max(taskMaxLength, taskName.length + 3);
          return [taskName, task];
        } else {
          return ['', ''];
        }
      });
    })
    .reduce(function(a, b) {
      return a.concat(b);
    })
    .filter(function(a) {
      return a.join('') !== '';
    });

  var framework = softlyAssureMonacaProject(process.cwd());

  tasks
    .sort(function(a, b) {
      var a_key = a[0];
      if (a[1].order < b[1].order) return -1;
      if (a[1].order > b[1].order) return 1;
      return 0;
    })
  .forEach(function(task) {
    var cmd = task[0],
      desc = task[1].description,
      dots = new Array(Math.max(15, taskMaxLength) - cmd.length).join('.');

    if (task[1].category && task[1].category === 'general') {
      if (!(task[1].frameworkSupport && task[1].frameworkSupport[framework])) {
        util.print('  ' + cmd.bold.info + '  ' + dots.grey + '  ' + desc.bold);
      }
    } else if (!framework && (task[1].category && task[1].category === 'rootOnly')) {
      util.print('  ' + cmd.bold.info + '  ' + dots.grey + '  ' + desc.bold);
    } else if (framework && task[1].frameworkSupport && task[1].frameworkSupport[framework]) {
      util.print('  ' + cmd.bold.info + '  ' + dots.grey + '  ' + desc.bold);
    }
  });

  util.print('');
};

var printExtendedCommands = function(isOnMonacaTerminal) {
  if (!isOnMonacaTerminal) {
    util.print('---------------------------------');
    util.print(('Create Monaca Project').bold.info);
    util.print('---------------------------------\n');
    util.print('  monaca create [<dir-name>|--template-list|--template <template-name>]');
    util.print('    create a new Monaca project\n');
  }

  util.print('---------------------------------');
  util.print(('Local Debug').bold.info);
  util.print('---------------------------------\n');
  util.print('  monaca preview | serve');
  util.print('    run a local web server for preview\n');
  util.print('  monaca demo');
  util.print('    run a local web server and displays the iOS/Android version of view, when supported\n');

  if (!isOnMonacaTerminal) {
    util.print('  monaca debug [--port <port>|--no-open]');
    util.print('    run app on the device by using Monaca Debugger\n');
    util.print(('  * Monaca Debugger for Android/iOS is available on\n    Google Play Store/Apple App Store.\n').bold.warn);
  }

  util.print('---------------------------------');
  util.print(('Local Build and Configuration').bold.info);
  util.print('---------------------------------\n');
  util.print('  monaca transpile [--generate-config|--install-dependencies]');
  util.print('    transpile project source code.\n');
  util.print('  monaca reconfigure [--transpile|--dependencies|--components]');
  util.print('    generate default project configurations\n');

  if (!isOnMonacaTerminal) {
    util.print('---------------------------------');
    util.print(('Using Monaca Cloud - Setup').bold.info);
    util.print('---------------------------------\n');
    util.print('  monaca signup <email>');
    util.print('    register a new Monaca account\n');
    util.print('  monaca login <email>');
    util.print('    sign in to Monaca Cloud\n');
    util.print('  monaca logout');
    util.print('    sign out from Monaca Cloud\n');
    util.print('  monaca config proxy [<proxy-server-url>|--reset]');
    util.print('    configure proxy to use when connecting to Monaca Cloud\n');
    util.print('  monaca config endpoint [<endpoint-url>|--reset]');
    util.print('    configure endpoint URL to use when connecting to Monaca Cloud\n');
    util.print(('  * For more details, please visit: https://monaca.io\n').bold.warn);
  }

  if (!isOnMonacaTerminal) {
    util.print('---------------------------------');
    util.print(('Using Monaca Cloud - Remote Build').bold.info);
    util.print('---------------------------------\n');
    util.print('  monaca remote build <platform> [--build-type <type>|--output <path>|--android_webview\n  (default|crosswalk)|--android_arch <arch>|--browser|--build-list]');
    util.print('    build project on Monaca Cloud\n');
    util.print('---------------------------------');
    util.print(('Using Monaca Cloud - Sync').bold.info);
    util.print('---------------------------------\n');
    util.print('  monaca clone');
    util.print('    clone from Monaca cloud project\n');
    util.print('  monaca download [--delete|--force|--dry-run]');
    util.print('    download project from Monaca Cloud\n');
    util.print('  monaca upload [--delete|--force|--dry-run]');
    util.print('    upload project to Monaca Cloud\n');
    util.print('---------------------------------');
    util.print(('Using Monaca Cloud - Import').bold.info);
    util.print('---------------------------------\n');
    util.print('  monaca import');
    util.print('    import from Monaca cloud project\n');
    util.print('---------------------------------');
    util.print(('Aliases for Cordova commands').bold.info);
    util.print('---------------------------------\n');
    util.print('  monaca plugin');
    util.print('    manage Cordova Plugin\n');
    util.print('  monaca platform');
    util.print('    add, update and remove platforms\n');
    util.print('  monaca info');
    util.print('    show info about Cordova environment\n');
    util.print('  monaca prepare');
    util.print('    prepare project for build\n');
    util.print('  monaca compile');
    util.print('    build the project\n');
    util.print('  monaca run');
    util.print('    deploy project on a device / emulator\n');
    util.print('  monaca build');
    util.print('    shortcut for prepare, then compile\n');
    util.print('  monaca emulate');
    util.print('    run project on emulator\n');
  }

  util.print('---------------------------------');
  util.print(('Local Environment Info').bold.info);
  util.print('---------------------------------\n');
  util.print('  monaca info');
  util.print('    display information about monaca dependencies, system, project dependencies and connection to Monaca Cloud\n');

  if (!isOnMonacaTerminal) {
    util.print('---------------------------------');
    util.print(('Docs').bold.info);
    util.print('---------------------------------\n');
    util.print('  monaca docs [onsen|tutorial|usage]');
    util.print('    display docs for Monaca CLI, Onsen UI and Tutorials\n');
  }

  util.print('---------------------------------');
  util.print(('Help').bold.info);
  util.print('---------------------------------\n');
  util.print('  monaca <command> --help');
  util.print('    show help for each command\n');
};

var printDescription = function() {
  util.print('  To learn about a specific command type:\n');
  util.print('  $ monaca <command> --help\n');
};

var printExamples = function() {
  util.print('Typical Usage:\n');

  util.print('  $ monaca create myproject # Create a new project from various templates');
  util.print('  $ cd myproject');
  util.print('  $ monaca preview # Preview app on a browser');
  util.print('  $ monaca debug # Run the app in Monaca Debugger');
  util.print('  $ monaca remote build # Execute remote build for packaging');
};

var printHelp = function(taskList, extended) {
  var isOnMonaca = terminal.isOnMonaca;

  printLogo();
  printUsage();
  if (extended) {
    printExtendedCommands(isOnMonaca); //change
  } else if (isOnMonaca) {
    printExtendedCommands(isOnMonaca);
  } else {
    printDescription();
    printCommands(taskList);
    printExamples();
  }

  util.print('');
};

module.exports = {
  findProjectDir: findProjectDir,
  assureMonacaProject: assureMonacaProject,
  confirmOverwrite: confirmOverwrite,
  printSuccessMessage: printSuccessMessage,
  softlyAssureMonacaProject: softlyAssureMonacaProject,
  loginErrorHandler: loginErrorHandler,
  printVersion: printVersion,
  printHelp: printHelp
};
})();
