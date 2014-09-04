var BaseTask = require('./task').BaseTask,
    exec = require('child_process').exec;

var MonacaCordova = function(){};

MonacaCordova.prototype = new BaseTask();

MonacaCordova.prototype.run = function(){
    var args = process.argv.length > 3 ? process.argv.slice(3).join(' ') : '';
    var cmd = 'cordova ' + process.argv[2] + ' ' + args;

    var childProcess = exec(cmd);

    childProcess.stdout.on('data', function(data){
        console.log(data);
    });

    childProcess.stderr.on('data', function(data){
        if (data) {
            process.stderr.write(data);
        }
    });
};

exports.MonacaCordova = MonacaCordova;
