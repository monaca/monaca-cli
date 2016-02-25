(function() {
  'use strict';

  var fs = require('fs'),
    rl = require('readline'),
    argv = require('optimist').argv,
    path = require('path'),
    Q = require(path.join(__dirname, 'qustom')),
    XMLDom = require('xmldom').DOMParser,
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

    monaca.createFromTemplate(template.templateId, path.resolve(dirName))
      .then(
        function() {
          util.print('Project created successfully.');
          return true;
        },
        function(error) {
          util.err('Error occurred while creating project : ' + JSON.stringify(error));
          return Q.reject(error);
        }
      )
      .then(
        function() {
          // Extract the project name if nested path is given before project name.
          // E.g. if command is 'create project Apps/Finance/myFinanceApp', then myFinanceApp will be taken as project name.
          var projectName = path.basename(dirName);

          injectData(path.join(path.resolve(dirName), 'config.xml'), 'name', projectName)
            .catch(
              function(error) {
                util.err('An error occurred while injecting project name in config.xml : ' + error);
              }
            );
        },
        function(error) {
          util.err(error);
        }
      );
  };

  function injectData(path, node, value) {
    var deferred = Q.defer();
    fs.readFile(path, 'utf8', function(error, data) {
      if (error) {
        deferred.reject(error);
      } else {
        var doc = new XMLDom().parseFromString(data, 'application/xml');
        var nodes = doc.getElementsByTagName(node);
        if (nodes.length > 0) {
          nodes[0].textContent = value;
          fs.writeFile(path, serializer.serializeToString(doc), function(error) {
            if (error) {
              deferred.reject(error);
            } else {
              deferred.resolve();
            }
          });
        } else {
          Q.reject('\'' + node + '\' not found in xml file.');
        }
      }
    });
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
      function(error) {
        util.err('Error in getting project templates list :' + error);
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
      function(error) {
        deferred.reject(error);
      }
    );

    return deferred.promise;
  };

  module.exports = CreateTask;
})();
