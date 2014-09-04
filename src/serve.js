var BaseTask = require('./task').BaseTask,
    spawn = require('child_process').spawn;

var MonacaServe = function(){};

MonacaServe.prototype = new BaseTask();

MonacaServe.prototype.run = function(){
    var args = process.argv.slice(2);
    var cordovaProcess = spawn('cordova', args);
    var gulpProcess = spawn('gulp', ['serve']);
    var fixLog = function(prefix, data){
        var ret = data.toString()
            .split('\n')
            .filter(function(item){ return item !== ''; })
            .map(function(item){ return prefix + item + '\n'; });

        return ret;
    };

    // cordova serve
    cordovaProcess.stdout.on('data', function(data){
        var logs = fixLog('Cordova: ', data);
        logs.forEach(function(log){
            process.stdout.write(log);
        });
    });

    cordovaProcess.stderr.on('data', function(data){
        var logs = fixLog('Cordova: ', data);
        logs.forEach(function(log){
            process.stderr.write(log);
        });
    });

    cordovaProcess.on('exit', function(){
        gulpProcess.kill();
    });

    // gulp serve
    gulpProcess.stdout.on('data', function(data){
        var logs = fixLog('gulp: ', data);
        logs.forEach(function(log){
            process.stdout.write(log);
        });
    });

    gulpProcess.stderr.on('data', function(data){
        var logs = fixLog('gulp: ', data);
        logs.forEach(function(log){
            process.stderr.write(log);
        });
    });

    gulpProcess.on('exit', function(){
        cordovaProcess.kill();
    });
};

exports.MonacaServe = MonacaServe;
