(function() {
  'use strict';

  var fs = require('fs'),
    rl = require('readline'),
    argv = require('optimist').argv,
    path = require('path'),
    exec = require('child_process').exec,
    Q = require(path.join(__dirname, 'qustom')),
    xmldom = require('xmldom').DOMParser,
    XMLSerializer = require('xmldom').XMLSerializer,
    serializer = new XMLSerializer(),
    Monaca = require('monaca-lib').Monaca,
    util = require(path.join(__dirname, 'util'));

  var monaca = new Monaca();

  var CreateTask = {};

  CreateTask.run = function(taskName) {
    monaca.relogin().then(
      function() {
        this.showTemplateQuestion();
      }.bind(this),
      function(error) {
        if (error === 'ECONNRESET') {
          util.err('Unable to connect to Monaca Cloud.');
          util.print('Are you connected to the Internet?');
          util.print('If you need to use a proxy, please configure it with "monaca proxy".');
        } else {
          util.err('Must be signed in to use this command.');
          util.print('Please sign in with \'monaca login\'.');
          util.print('If you don\'t have an account yet you can create one at https://monaca.mobi/en/register/start');
        }
      }
    );
  };

  CreateTask.createApp = function(template) {
    var dirName = argv._[1];

    monaca.createFromTemplate(template.templateId, path.resolve(dirName)).then(
        function() {
          util.print("Project created successfully.")
          return true;
        },
        function(err) {
          util.err("Error occurred while creating project : " + JSON.stringify(err));
          return Q.reject(err);
        }
      )
      .then(
        function() {
          // extract the project name if nested path is given before project name.
          // E.g. if command is 'create project Apps/Finance/myFinanceApp', then myFinanceApp will be taken as project name.
          var projectName = path.basename(dirName);

          injectData(path.join(path.resolve(dirName), "config.xml"), "name", projectName)
            .catch(
              function(err) {
                util.err("An error occurred while injecting project name in config.xml : " + err);
              }
            );
        },
        function(err) {
          util.err(err);
        }
      )
  };

  function injectData(path, node, value) {
    var deferred = Q.defer();
    fs.readFile(path, 'utf8', function(err, data) {
      if (err) {
        deferred.reject(err);
      } else {
        var doc = new xmldom().parseFromString(data, 'application/xml');
        var nodes = doc.getElementsByTagName(node);
        if (nodes.length > 0) {
          nodes[0].textContent = value;
          fs.writeFile(path, serializer.serializeToString(doc), function(err) {
            if (err) {
              deferred.reject(err);
            } else {
              deferred.resolve();
            }
          })
        } else {
          Q.reject("'" + node + "' not found in xml file.");
        }
      }
    })
    return deferred.promise;
  }

  CreateTask.showTemplateQuestion = function() {
    this.getTemplateList().then(
      function(templateList) {
        console.log(('Which project template do you want to use?\n').prompt);
        templateList.forEach(function(item, index) {
          util.print('\t' + (index + 1) + '. ' + item.title);
        });
        var question = function() {
          var i = rl.createInterface(process.stdin, process.stdout, null);
          i.question(('\nType number: ').input, function(answer) {
            i.close();
            if (answer.match(/\d+/) && templateList[parseInt(answer) - 1]) {
              this.createApp(templateList[parseInt(answer) - 1]);
            } else {
              question();
            }
          }.bind(this));
        }.bind(this);
        question();
      }.bind(this),
      function(err) {
        util.err("Error in getting project templates list :" + err);
        process.exit(1);
      }
    );

  };

  CreateTask.getTemplateList = function() {
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

  module.exports = CreateTask;
})();