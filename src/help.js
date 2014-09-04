var BaseTask = require('./task').BaseTask,
    fs = require('fs'),
    argv = require('optimist').argv,
    path = require('path');

var MonacaHelp = function(){};

MonacaHelp.prototype = new BaseTask();

MonacaHelp.prototype.run = function(){
    var file = path.join(__dirname, '..', 'doc', 'monaca.txt');
    var text = fs.readFile(file, function(err, data){
        if (err) throw err;

        process.stdout.write(data);
    });
};

exports.MonacaHelp = MonacaHelp;
