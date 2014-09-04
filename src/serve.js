var BaseTask = require('./task').BaseTask,
    spawn = require('child_process').spawn;

var MonacaServe = function(){};

MonacaServe.prototype = new BaseTask();

MonacaServe.prototype.run = function(){
    var args = process.argv.slice(2);
    var cordovaProcess = spawn('cordova', args);
    var gulpProcess = spawn('gulp', ['serve']);
    var fixLog = function(data){
        var ret = data.toString()
            .split('\n')
            .filter(function(item){ return item !== ''; })
            .map(function(item){ return item + '\n'; });

        return ret;
    };

    // cordova serve
    cordovaProcess.stdout.on('data', function(data){
        var logs = fixLog(data);
        logs.forEach(function(log){
            process.stdout.write('Cordova: '.yellow.bold + log.info);
        });
    });

    cordovaProcess.stderr.on('data', function(data){
        var logs = fixLog(data);
        logs.forEach(function(log){
            process.stderr.write('Cordova: '.yellow.bold + log.error);
        });
    });

    cordovaProcess.on('exit', function(){
        gulpProcess.kill();
    });

    // gulp serve
    gulpProcess.stdout.on('data', function(data){
        var logs = fixLog(data);
        logs.forEach(function(log){
            process.stdout.write('gulp: '.cyan.bold + log.info);
        });
    });

    gulpProcess.stderr.on('data', function(data){
        var logs = fixLog(data);
        logs.forEach(function(log){
            process.stderr.write('gulp: '.cyan.bold + log.error);
        });
    });

    gulpProcess.on('exit', function(){
        cordovaProcess.kill();
    });
};

exports.MonacaServe = MonacaServe;
