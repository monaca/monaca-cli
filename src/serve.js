var BaseTask = require('./task').BaseTask,
    path = require('path'),
    exec = require('child_process').exec;

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
};

exports.ServeTask = ServeTask;
