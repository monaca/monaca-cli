var BaseTask = require('./task').BaseTask,
    exec = require('child_process').exec;

var CordovaTask = function(){};

CordovaTask.prototype = new BaseTask();

CordovaTask.prototype.taskList = ['info','platform','plugin','prepare','compile','run','build','emulate'];

CordovaTask.prototype.run = function(){
    var args = process.argv.length > 3 ? process.argv.slice(3).join(' ') : '';
    var cmd = 'cordova ' + process.argv[2] + ' ' + args;

    var childProcess = exec(cmd);

    childProcess.stdout.on('data', function(data){
        console.log(data.toString().info);
    });

    childProcess.stderr.on('data', function(data){
        if (data) {
            process.stderr.write(data.toString().error);
        }
    });
};

exports.CordovaTask = CordovaTask;
