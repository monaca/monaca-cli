(function() {
'use strict';

var fs = require('fs'),
  argv = require('optimist').argv,
  path = require('path'),
  Q = require('q'),
  inquirer = require('inquirer'),
  XMLDom = require('xmldom').DOMParser,
  XMLSerializer = require('xmldom').XMLSerializer,
  serializer = new XMLSerializer(),
  Monaca = require('monaca-lib').Monaca,
  util = require(path.join(__dirname, 'util'));

var monaca = new Monaca();

var CreateTask = {};

CreateTask.run = function(taskName) {
  monaca.prepareSession().then(
    function() {
      fs.exists(path.resolve(argv._[1]), function(exists) {
        exists ? util.fail('Directory already exists.') : this.showTemplateQuestion();
      }.bind(this));
    }.bind(this),
    util.displayLoginErrors
  );
};

CreateTask.createApp = function(template) {
  var dirName = argv._[1];

  monaca.downloadTemplate(template.resource, path.resolve(dirName))
    .then(
      function() {
        // Extract the project name if nested path is given before project name.
        // E.g. if command is 'create project Apps/Finance/myFinanceApp', then myFinanceApp will be taken as project name.
        return injectData(path.join(path.resolve(dirName), 'config.xml'), 'name', path.basename(dirName));
      },
      util.fail.bind(null, 'Error occurred while creating project: ')
    )
    .then(
      util.success.bind(null, '\nProject created successfully.'),
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
    function(result) {
      var categories = {};
      result.template.forEach(function(category) {
        categories[category.type] = category.list;
      });

      inquirer.prompt({
        type: 'list',
        name: 'category',
        message: 'Choose a template category:',
        choices: Object.keys(categories).map(function(key) {
          return categories[key].length ? { name: key } : { name: key, disabled: 'Coming soon' };
        })
      }).then(function(answerCategory) {
        inquirer.prompt({
          type: 'list',
          name: 'template',
          message: 'Which project template do you want to use?',
          choices: categories[answerCategory.category].map(function(template, index) { return {name: template.name, value: index}; })
        }).then(function(answerTemplate) {
          this.createApp(categories[answerCategory.category][answerTemplate.template]);
        }.bind(this));
      }.bind(this));

    }.bind(this),
    util.fail.bind(null, 'Error in getting project templates list: ')
  );
};

module.exports = CreateTask;
})();
