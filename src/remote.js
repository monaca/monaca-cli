(function() {
  'use strict';

  var path = require('path'),
    open = require('open'),
    argv = require('optimist').argv,
    Monaca = require('monaca-lib').Monaca,
    util = require(path.join(__dirname, 'util'));

  var monaca = new Monaca();

  var BaseTask = require(path.join(__dirname, 'task')).BaseTask;

  var RemoteTask = function(){};

  RemoteTask.prototype = new BaseTask();

  RemoteTask.prototype.taskList = {
    'remote build': {
      description: 'build project on Monaca Cloud',
      longDescription: [
        'Build the project on Monaca Cloud.'        
      ],
      usage: ['monaca remote build'],
      options: [
        ['--platform', 'Should be one of - ios, android, windows'],
        ['--buid-type', 'Should be one of - debug (for iOS, Android and Windows. It is default option.),'],
        ['', 'test (for iOS only),'],
        ['', 'release (for iOS, Android and Chrome Apps)'],
        ['--android_webview', 'If platform is android. Should be one of - default, crosswalk'],
        ['--android_arch', 'Required if --android_webview is crosswalk. Should be one of - x86, arm'] 
      ],
      examples: [        
        'monaca remote build --platform=ios --build-type=test',
        'monaca remote build --platform=android --build-type=debug --android_webview=crosswalk --android_arch=arm'
      ]
    }
  };

  RemoteTask.prototype.run = function(taskName){
    var self = this;

    if (!this.isMyTask(taskName)) {
      return;
    }

    monaca.relogin().then(
      function() {
        var task = argv._[1];

        if (task === 'build') {
          self.build();
        }
        else {
          util.err('No such command.');
          process.exit(1);
        }
      },
      function() {
        util.err('Must be signed in to use this command.');
        util.print('Please sign in with \'monaca login\'.');
        util.print('If you don\'t have an account yet you can create one at https://monaca.mobi/en/register/start');
        process.exit(1);
      }
    );
  };

  RemoteTask.prototype.build = function() {

    if (!argv.platform || argv['build-type']) {
      util.err('"platform" and "build-type" are mandatory parameters.');      
      process.exit(1);
    }

    var params = {
      platform: argv.platform,
      purpose: argv['build-type']
    }

    if(argv.android_webview) {
      params.android_webview = argv.android_webview;
    }

    if(argv.android_arch) {
      params.android_arch = argv.android_arch;
    }

    // using hardcoded project_id until a method is written to get project ids.
    monaca.buildProject("5461dd0a7e2193d95ed41537", params).
    then(function(result) {
      if(result.binary_url) {
        util.print("Url to download your package is " +  result.binary_url);
      }
      else {
        util.err(result.error_message);
      }      
    },
    function(err) {
      util.err(err);
    },
    function (progress) {
      util.print(progress);
    });
  };

  exports.RemoteTask = RemoteTask;
})();
