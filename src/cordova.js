var path = require('path'),
    exec = require('child_process').exec;

var BaseTask = require(path.join(__dirname, 'task')).BaseTask;

var CordovaTask = function(){};

CordovaTask.prototype = new BaseTask();

CordovaTask.prototype.taskList = ['info','platform','plugin','prepare','compile','run','build','emulate'];

CordovaTask.prototype.taskList = {
  info: {
    description: 'show info about Cordova environment',
    usage: 'monaca info',
    longDescription: [
      'Prints out information about the Cordova environment.',
      'Also creates a file, info.txt, at the base of the project.'
    ],
    examples: ['monaca info']
  },
  platform: {
    description: 'add, update and remove platforms',
    longDescription: [
      'Manage platforms. Can be used to add or remove platforms.',
      'Also contains commands to update existing platforms.'
    ],
    usage: 'monaca platform <command> [options]',
    options: [
      ['add|remove|rm <platform>', 'add or remove a platform'],
      ['list|ls', 'list available platforms'],
      ['update|up <platform>', 'update a platform'],
      ['check', 'list platforms that can be updated with `platform update`']
    ],
    examples: [
      'monaca platform',
      'monaca platform add android',
      'monaca platform rm ios',
      'monaca platform check'
    ]
  },
  plugin: {
    description: 'manage installed plugins',
    longDescription: [
      'Manage installed plugins',
      '',
      'Used to add or remove plugins. Can also list installed plugins.' 
    ],
    usage: 'monaca plugin <command> [options]',
    options: [
      ['add|rm <plugin>', 'add or remove a plugin'],
      ['ls|list', 'list currently installed plugins'],
      ['search <query>', 'search the plugin directory']
    ],
    examples: [
      'monaca plugin add some.nice.plugin',
      'monaca plugin rm unused.plugin',
      'monaca plugin search keyboard',
      'monaca plugin ls'
    ]
  },
  prepare: {
    description: 'prepare project for build',
    longDescription: 'Copies file for a specified (or all) platform(s).',
    usage: 'monaca prepare [platform]',
    examples: [
      'monaca prepare',
      'monaca prepare android'
    ]
  },
  compile: {
    description: 'build the project',
    longDescription: 'Build the project for a specified platform, or all platforms.',
    usage: 'monaca compile [platform]',
    examples: [
      'monaca compile',
      'monaca compile android'
    ]
  },
  run: {
    description: 'deploys project on a device / emulator',
    longDescription: 'Deploys app on a specified platform or emulator.',
    usage: 'monaca run [platform]',
    options: [
      ['--debug', 'build a debug version'],
      ['--release', 'build a release version'],
      ['--device=FOO', 'deploy on a specific device'],
      ['--emulator=FOO', 'deploy on a specific emulator'],
      ['--target=FOO', 'deploy on a specific target']
    ],
    examples: [
      'monaca run',
      'monaca run android',
      'monaca run ios --emulator'
    ]
  },
  build: {
    description: 'shortcut for compile, then prepare',
    longDescription: 'Shortcut for `monaca compile` then `monaca prepare`.',
    usage: 'monaca build [platform]',
    examples: [
      'monaca build ios',
      'monaca build'
    ]
  },
  emulate: {
    description: 'run project in emulator',
    longDescription: 'Run project in emulator. Shortcut for `monaca run --emulator`.',
    usage: 'monaca emulate [platform]',
    examples: [
      'monaca emulate android',
      'monaca emulate'
    ]
  }
};

CordovaTask.prototype.run = function(taskName){
    if (!this.isMyTask(taskName)) return;

    var args = process.argv.length > 3 ? process.argv.slice(3).join(' ') : '';
    var cmd = path.join(__dirname, '..', 'node_modules', '.bin', 'cordova') + ' ' + taskName + ' ' + args;

    var childProcess = exec(cmd);

    childProcess.stdout.on('data', function(data){
        process.stdout.write(data.toString());
    });

    childProcess.stderr.on('data', function(data){
        if (data) {
            process.stderr.write(data.toString().error);
        }
    });

    childProcess.on('exit', function(code){
        if (code !== 0) {
            process.exit(code);
        }
    });
};

exports.CordovaTask = CordovaTask;
