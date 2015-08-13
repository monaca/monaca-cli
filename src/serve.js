var path = require('path'),
    exec = require('child_process').exec,
    fs = require('fs'),
    shell = require('shelljs'),
    Q = require('q');

var util = require(path.join(__dirname, 'util'));
  
var BaseTask = require(path.join(__dirname, 'task')).BaseTask;

var ServeTask = function(){};

ServeTask.prototype = new BaseTask();

ServeTask.prototype.taskList = {
  serve: {
    description: 'runs a local web server for assets',
    longDescription: [
      'Starts a local web server that serves the www assets.',
      '',
      'Will watch the file-system for changes and reload the',
      'browser when a change occurs.',
      '',
      'Port defaults to 8000'
    ],
    usage: 'monaca serve [port]',
    examples: [
      'monaca serve',
      'monaca serve 8001'
    ],
    showInHelp : false
  }
};

/*
 * Checks that directory contains www.
 * If it does it will copy package.json and gulpfile.js from the templates folder
 * if needed.
 */
ServeTask.prototype.assureCordovaProject = function(projectPath) {
  var deferred = Q.defer();

  var assureFile = function(fn) {
    var deferred = Q.defer(),
      loc = path.join(projectPath, fn),
      template = path.join(__dirname, 'serve', fn);

    fs.exists(loc, function(exists) {
      if (exists) {
        deferred.resolve();
      }
      else {
        shell.cp(template, loc);
        deferred.resolve();
      }
    });

    return deferred.promise;
  };

  fs.exists(path.join(projectPath, 'www'), function(exists) {
    if (!exists) {
      deferred.reject('Directory doesn\'t contain a www/ folder.');
    }
    else {
      Q.all([assureFile('gulpfile.js'), assureFile('package.json')]).then(
        function() {
          util.print('Installing packages. Please wait. This might take a couple of minutes.');

          var process = exec('npm install');
          process.on('exit', function(code) {
            if (code === 0) {
              deferred.resolve();
            }
            else {
              deferred.reject('Failed installing packages.');
            }
          });

          process.stdout.on('data', function(data) {
            util.print(data);
          });

          process.stderr.on('data', function(data) {
            util.err(data);
          });
        }
      );
    }
  });

  return deferred.promise;
};

ServeTask.prototype.run = function(taskName){
    if (!this.isMyTask(taskName)) {
      return;
    }

    this.assureCordovaProject(process.cwd()).then(
      function() {
        var fixLog = function(data){
                var ret = data.toString()
                    .split('\n')
                    .filter(function(item){ return item !== ''; })
                    .map(function(item){ return item + '\n'; });

                return ret;
            },
            processes = [
                {
                    name: 'Cordova',
                    process: exec(path.join(__dirname, '..', 'node_modules', '.bin', 'cordova') + ' '  + process.argv.slice(2).join(' ')),
                    color: 'yellow'
                },
                {
                    name: 'gulp',
                    process: exec(path.join(__dirname, '..', 'node_modules', '.bin', 'gulp') + ' serve'),
                    color: 'cyan'
                }
            ],
            stopProcesses = function(){
                processes.forEach(function(item){
                    item.process.kill();
                });
            };

        processes.forEach(function(item){
            item.process.stdout.on('data', function(data){
                fixLog(data).forEach(function(log){
                    process.stdout.write((item.name + ': ').bold[item.color] + log.info);
                });
            });

            item.process.stderr.on('data', function(data){
                fixLog(data).forEach(function(log){
                    process.stderr.write((item.name + ': ').bold[item.color] + log.error);
                });
            });

            item.process.on('exit', function(code){
                if (code !== 0) {
                    stopProcesses();
                    process.exit(code);
                }
            });
        });
      },
      function(error) {
        util.error('Failed serving project: ' + error);
        process.exit(1);
      }
    );
};

exports.ServeTask = ServeTask;
