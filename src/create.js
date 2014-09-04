var BaseTask = require('./task').BaseTask,
    fs = require('fs'),
    rl = require('readline'),
    argv = require('optimist').argv,
    path = require('path'),
    unzip = require('unzip'),
    rimraf = require('rimraf'),
    exec = require('child_process').exec;

var MonacaCreate = function(){};

MonacaCreate.prototype = new BaseTask();

MonacaCreate.prototype.run = function(){
    if (argv._.length < 2) {
        console.log(('At least the dir must be provided to create new project. See `monaca help`.').error);
        return;
    }

    var template = argv.template;

    if (!template) {
        this.showTemplateQuestion();
    } else {
        this.createApp(template);       
    }
};

MonacaCreate.prototype.createApp = function(template){
    var self = this;
    var args = argv._;
    var dirName = argv._[1];
    var cmd = 'cordova ' + args.join(' ');
    var childProcess = exec(cmd);

    childProcess.stdout.on('data', function(data){
        console.log(data.toString().info);
    });

    childProcess.stderr.on('data', function(data){
        process.stderr.write(data.toString().error);
    });

    childProcess.on('exit', function(code){
        if (code === 0) {
            self.replaceTemplate(dirName, template);
        }
    });
};

MonacaCreate.prototype.showTemplateQuestion = function(){
    var self = this;
    var templateList = this.getTemplateList();

    // Add Empty
    templateList.unshift({
        name: 'Empty',
        path: null
    });

    console.log(('Which project template do you use?\n').prompt);

    templateList.forEach(function(item, index){
        console.log((index + 1) + ': ' + item.name);
    });

    var question = function(){
        var i = rl.createInterface(process.stdin, process.stdout, null);
        i.question(('\nType number>').input, function(answer){
            i.close();
            if (answer.match(/\d+/) && templateList[parseInt(answer) - 1]) {
                self.createApp(templateList[parseInt(answer) - 1]);
            } else {
                question();
            }           
        });
    };
    question();
};

MonacaCreate.prototype.getTemplateList = function(){
    var dir = path.join(__dirname, '..', 'templates'),
        list = [];

    var files = fs.readdirSync(dir);

    files.forEach(function(file){
        if (file.match(/\.zip$/g)) {
            list.push({
                name: file.replace(/\.zip/g, '').replace(/onsen_/g, '').replace(/_/g, ' '),
                path: path.join(dir, file)
            });
        }
    });

    return list;
};

MonacaCreate.prototype.replaceTemplate = function(dirName, template){
    if (template.path) {
        var tmpPath = path.join('/tmp', 'ons' + new Date().getTime().toString());
        var wwwPath = path.join(dirName, 'www');

        try {
            fs.createReadStream(template.path).pipe(unzip.Extract({path: tmpPath}))
                .on('close', function(){
                    ['.jshintrc', 'gulpfile.js', 'package.json', 'README.md'].forEach(function(name){
                        fs.renameSync(path.join(tmpPath, name), path.join(dirName, name));
                    });

                    rimraf.sync(wwwPath);           

                    fs.renameSync(path.join(tmpPath, 'www'), wwwPath);

                    rimraf.sync(tmpPath);

                    console.log(('Set template: ' + template.name).info);
                })
                .on('error', function(error){
                    console.log(('Error: ' + error).error);
                });           
        } catch (error) {
            console.log(('Error: ' + error).error);
        }
    }
};

exports.MonacaCreate = MonacaCreate;
