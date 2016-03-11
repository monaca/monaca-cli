(function() {
  'use strict';

  var fs = require('fs'),
    rl = require('readline'),
    argv = require('optimist').argv,
    path = require('path'),
    Q = require('q'),
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
      util.displayLoginErrors
    );
  };

  CreateTask.createApp = function(template) {
    var dirName = argv._[1];

    monaca.createFromTemplate(template.templateId, path.resolve(dirName))
      .then(
        function() {
          // Extract the project name if nested path is given before project name.
          // E.g. if command is 'create project Apps/Finance/myFinanceApp', then myFinanceApp will be taken as project name.
          return injectData(path.join(path.resolve(dirName), 'config.xml'), 'name', path.basename(dirName));
        },
        util.fail.bind(null, 'Error occurred while creating project: ')
      )
      .then(
        util.print.bind(null, '\nProject created successfully.'),
        util.fail.bind(null, 'An error occurred while injecting project name in config.xml: ')
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
          deferred.reject('\'' + node + '\' not found in xml file.');
        }
      }
    });
    return deferred.promise;
  }

  CreateTask.showTemplateQuestion = function() {
    monaca.getTemplates().then(
      function(templateList) {
        util.print('Which project template do you want to use?'.prompt);

        templateList.forEach(function(item, index) {
          util.print(' ' + (index + 1) + '. ' + item.title);
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
      util.fail.bind(null, 'Error in getting project templates list: ')
    );
  };

  module.exports = CreateTask;
})();
