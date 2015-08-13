var fs = require('fs-extra'),
    rl = require('readline'),
    argv = require('optimist').argv,
    path = require('path'),
    unzip = require('unzip'),
    rimraf = require('rimraf'),    
    exec = require('child_process').exec,
    Q = require('q'),
    Monaca = require('monaca-lib').Monaca,
    Localkit = require('monaca-lib').Localkit;

var util = require(path.join(__dirname, 'util'));
var monaca = new Monaca();

var BaseTask = require(path.join(__dirname, 'task')).BaseTask;

var CreateTask = function(){};

CreateTask.prototype = new BaseTask();

CreateTask.prototype.taskList = {
  create: {
    description: 'create a new Monaca project',
    usage: 'monaca create path',
    longDescription: [
      'Creates a new application at a provided path.',
      '',
      'The command downloads a list of available templates',
      'and then displays a list for the user to choose from.',
      '',
      'The specified project will be created in a directory',
      'given by the user.'
    ],
    options: [
      
    ],
    examples: [
      'monaca create myproject'
    ]
  }
};

CreateTask.prototype.run = function(taskName){
    if (!this.isMyTask(taskName)) {
      return;
    }
    if (argv._.length < 2) {
      this.displayHelp(taskName);
      process.exit(1);
    }    
    monaca.relogin().then(
      function() {        
        this.showTemplateQuestion();    
      }.bind(this),
      function(error) {
        if (error === 'ECONNRESET') {
          util.err('Unable to connect to Monaca Cloud.');
          util.print('Are you connected to the Internet?');
          util.print('If you need to use a proxy, please configure it with "monaca proxy".');
        }
        else {
          util.err('Must be signed in to use this command.');
          util.print('Please sign in with \'monaca login\'.');
          util.print('If you don\'t have an account yet you can create one at https://monaca.mobi/en/register/start');
        }
      }
    );    
};

CreateTask.prototype.createApp = function(template){
    var self = this,
        args = argv._,
        dirName = args[1];        
        monaca.createFromTemplate(template.templateId, path.resolve(dirName)).then(
            function() {
                util.print("Project created successfully.")
            },
            function(err) {
                util.err("Error occurred while creating project : " + JSON.stringify(err));
            }
        );
};

CreateTask.prototype.showTemplateQuestion = function(){
    var self = this;    
    
    this.getTemplateList().then(
        function(templateList) {            
            console.log(('Which project template do you use?\n').prompt);
            templateList.forEach(function(item, index){
                console.log((index + 1) + ': ' + item.title);
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
        },
        function(err) {
            util.err("Error in getting project templates list :" + err);
            process.exit(1);            
        }
    );

};

CreateTask.prototype.getTemplateList = function(){
    var deferred = Q.defer();    
    monaca.getTemplates().then(
        function(list) {
            deferred.resolve(list);
        },
        function(err) {            
            deferred.reject(err);
        }
    )
    return deferred.promise;
};

exports.CreateTask = CreateTask;
