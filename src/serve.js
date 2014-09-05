var BaseTask = require('./task').BaseTask,
    spawn = require('child_process').spawn;

var ServeTask = function(){};

ServeTask.prototype = new BaseTask();

ServeTask.prototype.taskList = ['serve'];

ServeTask.prototype.run = function(taskName){
    if (!this.isMyTask(taskName)) return;

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
                process: spawn('cordova', process.argv.slice(2)),
                color: 'yellow'
            },
            {
                name: 'gulp',
                process: spawn('gulp', ['serve']),
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

        item.process.on('exit', function(){
            stopProcesses();
        });
    });
};

exports.ServeTask = ServeTask;
