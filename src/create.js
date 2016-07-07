(function() {
'use strict';

var fs = require('fs'),
  argv = require('optimist').argv,
  path = require('path'),
  open = require('open'),
  Q = require('q'),
  inquirer = require('monaca-inquirer'),
  XMLDom = require('xmldom').DOMParser,
  XMLSerializer = require('xmldom').XMLSerializer,
  serializer = new XMLSerializer(),
  Monaca = require('monaca-lib').Monaca,
  util = require(path.join(__dirname, 'util'));

var CreateTask = {}, monaca, report = { event: 'create' };

CreateTask.run = function(taskName, info) {
  monaca = new Monaca(info);
  fs.exists(path.resolve(argv._[1]), function(exists) {
    if (exists) {
      util.fail('Directory already exists.');
    } else {
      monaca.reportAnalytics(report);
      this.showTemplateQuestion();
    }
  }.bind(this));
};

CreateTask.createApp = function(template) {
  var dirName = argv._[1];
  var error = 'Error occurred while creating project: ';
  report.arg1 = template.name;

  monaca.downloadTemplate(template.resource, path.resolve(dirName))
    .then(
      function() {
        // Extract the project name if nested path is given before project name.
        // E.g. if command is 'create project Apps/Finance/myFinanceApp', then myFinanceApp will be taken as project name.
        error = 'An error occurred while injecting project name in config.xml: ';
        return injectData(path.join(path.resolve(dirName), 'config.xml'), 'name', path.basename(dirName));
      }
    )
    .then(
      monaca.reportFinish.bind(monaca, report),
      monaca.reportFail.bind(monaca, report)
    )
    .then(
      function() {
        util.success('\nProject created successfully.')
        var message = [
            '',
            'Type "cd ' + dirName + '" and run monaca command again.',
            '  > ' + 'monaca preview'.info + '      => Run app in the browser',
            '  > ' + 'monaca debug'.info + '        => Run app in the device using Monaca Debugger',
            '  > ' + 'monaca remote build'.info + ' => Start remote build for iOS/Android/Windows',
            '  > ' + 'monaca upload'.info + '       => Upload this project to Monaca Cloud IDE'
          ].join("\n");
        util.print(message);
      }.bind(null),
      util.fail.bind(null, error)
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

      inquiry.categories.call(this);

    }.bind(this),
    util.fail.bind(null, 'Error in getting project templates list: ')
  );
};

var inquiry = {

  categories: function() {
    inquirer.prompt({
      type: 'list',
      name: 'category',
      message: 'Choose a category:',
      cancelable: false,
      choices: Object.keys(this.categories).map(function(key) {
        return this.categories[key].length ? { name: key } : { name: key, disabled: 'Coming soon' };
      }.bind(this)).concat([{ name: 'Sample Apps'}])
    }).then(function(answer) {
      answer.category === 'Sample Apps' ? inquiry.samples.call(this) : inquiry.template.call(this, answer.category);
    }.bind(this));
  },

  template: function(answerCategory) {
    inquirer.prompt({
      type: 'list',
      name: 'template',
      message: 'Select a template - Press ' + 'P'.info + ' to see a preview',
      cancelable: true,
      keyAction: {
        p: function(currentValue) {
          if (this.categories[answerCategory][currentValue].preview) {
            open(this.categories[answerCategory][currentValue].preview);
          }
        }.bind(this)
      },
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
  },

  samples: function() {
    inquirer.prompt({
      type: 'list',
      name: 'sample',
      message: 'Select a sample app - Press ' + 'P'.info + ' to see a preview',
      cancelable: true,
      keyAction: {
        p: function(currentValue) {
          if (this.samples[currentValue].preview) {
            open(this.samples[currentValue].preview);
          }
        }.bind(this)
      },
      choices: this.samples.map(function(sample, index) {
        return { name: sample.name + '   # ' + sample.description, short: sample.name, value: index }
      }.bind(this))
    }).then(function(answer) {
      if (answer.sample === null) {
        inquiry.categories.call(this);
      } else {
        CreateTask.createApp(this.samples[answer.sample]);
      }
    }.bind(this));
  }
};

module.exports = CreateTask;
})();
