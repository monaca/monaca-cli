var MonacaCordova = require('./cordova').MonacaCordova,
    MonacaHelp = require('./help').MonacaHelp,
    MonacaCreate = require('./create').MonacaCreate,
    MonacaServe = require('./serve').MonacaServe,
    argv = require('optimist').argv,
    colors = require('colors');

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

var Monaca = {
    TASK_LIST: [
        {
            name: 'create',
            target: MonacaCreate
        },
        {
            name: 'serve',
            target: MonacaServe
        },
        {
            name: 'info',
            target: MonacaCordova
        },
        {
            name: 'platform',
            target: MonacaCordova
        },
        {
            name: 'plugin',
            target: MonacaCordova
        },
        {
            name: 'prepare',
            target: MonacaCordova
        },
        {
            name: 'compile',
            target: MonacaCordova
        },
        {
            name: 'run',
            target: MonacaCordova
        },
        {
            name: 'build',
            target: MonacaCordova
        },
        {
            name: 'emulate',
            target: MonacaCordova
        },
    ],
    VERSION: '0.0.1',
    _getTask: function(){
        if (argv._.length) {
            var name = argv._[0];

            for (var i = 0, l = this.TASK_LIST.length; i < l; i++) {
                var task = this.TASK_LIST[i];

                if (task.name === name) {
                    return task;
                }
            }
        }
    },
    run: function(){
        // version
        if (argv.version || argv.v || (argv._.length && argv._[0] === 'version')) {
            this.printVersion();
            return;
        }

        // help
        if (argv.h || argv.help || !argv._.length || argv._[0] === 'help') {
            this.printHelp();
            return;
        }

        var task = this._getTask();

        if (!task) {
            process.stderr.write(('Error: ' + argv._[0] + ' is not a valid task.\n').error);
            return;
        }

        var target = new task.target();

        target.run();
    },
    printVersion: function(){
        console.log((this.VERSION).info.bold);
    },
    printHelp: function(){
        var target = new MonacaHelp();
        target.run();
    }
};

exports.Monaca = Monaca;
