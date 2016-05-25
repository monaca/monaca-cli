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
  fs.exists(path.resolve(argv._[1]), function(exists) {
    exists ? util.fail('Directory already exists.') : this.showTemplateQuestion();
  }.bind(this));
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
      function() {
        util.success('\nProject created successfully.')
        var message = [
            '',
            'Type "cd ' + dirName + '" and run monaca command again.',
            '  > monaca preview      => Run app in the browser',
            '  > monaca debug        => Run app in the device using Monaca Debugger',
            '  > monaca remote build => Start remote build for iOS/Android/Windows',
            '  > monaca upload       => Upload this project to Monaca Cloud IDE'
          ].join("\n");
        util.print(message);
      }.bind(null),
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

      this.samples = result.sample;
      this.categories = categories;

      inquiry.type.call(this);


    }.bind(this),
    util.fail.bind(null, 'Error in getting project templates list: ')
  );
};

var inquiry = {

  type: function() {
    inquirer.prompt({
      type: 'list',
      name: 'type',
      message: 'Select an option:',
      choices: ['Sample Apps', 'Templates']
    }).then(function(answer) {
      answer.type === 'Sample Apps' ? inquiry.samples.call(this) : inquiry.categories.call(this);
    }.bind(this));
  },

  samples: function() {
    inquirer.prompt({
      type: 'list',
      name: 'sample',
      message: 'Select a sample app:',
      cancelable: true,
      choices: this.samples.map(function(sample, index) {
        return { name: sample.name + '   # ' + sample.description, short: sample.name, value: index }
      }.bind(this))
    }).then(function(answer) {
      if (answer.sample === null) {
        inquiry.type.call(this);
      } else {
        CreateTask.createApp(this.samples[answer.sample]);
      }
    }.bind(this));
  },

  categories: function() {
    inquirer.prompt({
      type: 'list',
      name: 'category',
      message: 'Choose a template category:',
      cancelable: true,
      choices: Object.keys(this.categories).map(function(key) {
        return this.categories[key].length ? { name: key } : { name: key, disabled: 'Coming soon' };
      }.bind(this))
    }).then(function(answer) {
      if (answer.category === null) {
        inquiry.type.call(this);
      } else {
        inquiry.template.call(this, answer.category);
      }
    }.bind(this));
  },

  template: function(answerCategory) {
    inquirer.prompt({
      type: 'list',
      name: 'template',
      message: 'Which project template do you want to use?',
      cancelable: true,
      choices: this.categories[answerCategory]
        .sort(function(a, b) {
          if (a.name > b.name) return -1;
          if (a.name < b.name) return 1;
          return 0;
        })
        .map(function(template, index) { return {name: template.name, value: index}; })
    }).then(function(answer) {
      if (answer.template === null) {
        inquiry.categories.call(this);
      } else {
        CreateTask.createApp(this.categories[answerCategory][answer.template]);
      }
    }.bind(this));
  }
}

module.exports = CreateTask;
})();
