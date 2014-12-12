var BaseTask = require('./task').BaseTask,
    fs = require('fs'),
    rl = require('readline'),
    argv = require('optimist').argv,
    path = require('path'),
    unzip = require('unzip'),
    rimraf = require('rimraf'),
    exec = require('child_process').exec;

var CreateTask = function(){};

CreateTask.prototype = new BaseTask();

CreateTask.prototype.taskList = {
  create: {
    description: 'create a new Monaca project',
    usage: 'monaca create path [id] [name] [config]',
    longDescription: [
      'Creates a new application at a provided path.',
      '',
      'Both application ID and name are customizable.'
    ],
    options: [
      ['--copy-from|src=path', 'use custom www assets'],
      ['--link-to=path', 'create a symbolic link to www assets'],
      ['--template', 'chose a template']
    ],
    examples: [
      'monaca create myproject'
    ]
  }
};

CreateTask.prototype.run = function(taskName){
    if (!this.isMyTask(taskName)) return;

    if (argv._.length < 2) {
      this.displayHelp(taskName);
      process.exit(1);
    }

    var templateName = argv.template;

    if (!templateName) {
        this.showTemplateQuestion();
    } else {
        var template = this.getTemplateFromName(templateName);

        if (!template) {
            process.stderr.write(('Error: monaca does not have ' + templateName + ' template').error);
            process.exit(1);
        }

        this.createApp(template);       
    }
};

CreateTask.prototype.createApp = function(template){
    var self = this,
        args = argv._,
        dirName = args[1],
        cmd = path.join(__dirname, '..', 'node_modules', '.bin', 'cordova') + ' '  + args.join(' '),
        childProcess = exec(cmd);

    childProcess.stdout.on('data', function(data){
        console.log(data.toString().info);
    });

    childProcess.stderr.on('data', function(data){
        process.stderr.write(data.toString().error);
    });

    childProcess.on('exit', function(code){
        if (code === 0) {
            self.replaceTemplate(dirName, template);
        } else {
            process.exit(code);
        }
    });
};

CreateTask.prototype.showTemplateQuestion = function(){
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

CreateTask.prototype.getTemplateList = function(){
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

CreateTask.prototype.getTemplateFromName = function(name){
    var filepath = null;

    if (name !== 'Empty') {
        filepath = path.join(__dirname, '..', 'templates', 'onsen_' + name.replace(' ', '_') + '.zip');

        try {
            fs.statSync(filepath);
        } catch (e) {
            return null;
        }
    }

    return {
        name: name,
        path: filepath
    };
};

CreateTask.prototype.replaceTemplate = function(dirName, template){
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

                    // npm install
                    npmProcess = exec('npm install --prefix ' + dirName);
                    npmProcess.stdout.on('data', function(data){
                        console.log(data.toString().info);
                    });

                    npmProcess.stderr.on('data', function(data){
                        console.log(data.toString().error);
                    });

                    npmProcess.on('exit', function(code){
                        if (code === 0) {
                            console.log(('Set template: ' + template.name).info);
                        } else {
                            process.exit(code);
                        }
                    });
                })
                .on('error', function(error){
                    console.log(('Error: ' + error).error);
                });           
        } catch (error) {
            console.log(('Error: ' + error).error);
        }
    }
};

exports.CreateTask = CreateTask;
