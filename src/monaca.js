var argv = require('optimist').argv,
    colors = require('colors'),
    fs = require('fs'),
    path = require('path');

colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: ['yellow', 'bold'],
    debug: 'blue',
    error: ['red', 'bold']
});

var taskList = [
    new (require('./cordova').CordovaTask)(),
    new (require('./create').CreateTask)(),
    new (require('./serve').ServeTask)(),
];

var Monaca = {
    VERSION: '0.0.1',
    _getTask: function(taskName){
        if (!taskName) return null;

        for (var i = 0, l = taskList.length; i < l; i++) {
            var task = taskList[i];

            if (task.isMyTask(taskName)) {
                return task;
            }
        }
    },
    run: function(){
        var taskName = argv._.length ? argv._[0] : null;

        // version
        if (taskName === 'version' || argv.version || argv.v) {
            this.printVersion();
            return;
        }

        // help
        if (!taskName || taskName === 'help' || argv.h || argv.help) {
            this.printHelp();
            return;
        }

        var task = this._getTask(taskName);

        if (!task) {
            process.stderr.write(('Error: ' + taskName + ' is not a valid task.\n').error);
            return;
        }

        task.run(taskName);
    },
    printVersion: function(){
        console.log((this.VERSION).info.bold);
    },
    printHelp: function(){
        var file = path.join(__dirname, '..', 'doc', 'monaca.txt');
        fs.readFile(file, function(err, data){
            if (err) throw err;

            process.stdout.write(data);
        });
    }
};

exports.Monaca = Monaca;
