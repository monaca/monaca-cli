(function() {
'use strict';

var fs = require('fs'),
  path = require('path'),
  open = require('open'),
  Q = require('q'),
  inquirer = require('monaca-inquirer'),
  argv = require('optimist').argv,
  XMLDom = require('xmldom').DOMParser,
  XMLSerializer = require('xmldom').XMLSerializer,
  serializer = new XMLSerializer(),
  Monaca = require('monaca-lib').Monaca,
  util = require(path.join(__dirname, 'util')),
  sync = require(path.join(__dirname, 'sync'));

var CreateTask = {}, monaca, report = { event: 'create' },
  dirName = argv._[argv._.indexOf('create') + 1],
  monacaInfo;

CreateTask.run = function(taskName, info) {
  monaca = new Monaca(info),
  monacaInfo = info;

  if (argv && argv['template-list']) {
    util.print("The following templates can be installed by executing\n\nmonaca create [projectName] --template [templateName]\n");
    this.displayTemplates(argv);
  } else {
    fs.exists(path.resolve(dirName), function(exists) {
      if (exists) {
        util.fail('Directory already exists.');
      } else {
        monaca.reportAnalytics(report);
        if (argv.url) {
          this.createApp({
            name: 'Custom Template',
            resource: argv.url
          });
        } else if (argv.template) {
          this.getTemplateURL(argv.template);
        } else {
          if (process.platform === 'win32') {
            util.warn("\nSome Windows terminals may not work correctly with the interactive template creation.\n" +
              "If that's the case, please execute `monaca create --help` for an alternative solution.\n")
          }
          this.displayTemplates();
        }
      }
    }.bind(this));
  }
};

CreateTask.createApp = function(template) {
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
            '  > ' + 'monaca upload'.info + '       => Upload this project to Monaca Cloud IDE\n'
          ].join("\n");
        util.print(message);
      }.bind(null),
      util.fail.bind(null, error)
    )
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

CreateTask.getTemplateURL = function(requiredTemplate) {

  monaca.getTemplates().then(
    function(result) {
      var categories = {};
      result.template.forEach(function(category) {
        categories[category.type] = category.list;
      });

      this.samples = result.sample;
      this.categories = categories;

      for (var key in this.categories) {
        var categoryContent = this.categories[key];
        for (var template in categoryContent) {
          var currentTemplate = categoryContent[template];
          if (currentTemplate['repo_name'] === requiredTemplate) {
            return this.createApp({
              name: requiredTemplate,
              resource: categoryContent[template].resource
            });
          }
        }
      }

      for (var key in this.samples) {
        var currentTemplate = this.samples[key];
        if (currentTemplate['repo_name'] === requiredTemplate) {
          return this.createApp({
            name: requiredTemplate,
            resource: this.samples[key].resource
          });
        }
      }

      util.fail("Could not find the specified template.\nPlease run `monaca create --template-list` to see all the available templates.");

    }.bind(this),
    util.fail.bind(null, 'Error in getting project templates list: ')
  );
}

CreateTask.displayTemplates = function(argv) {

  monaca.getTemplates().then(
    function(result) {
      var categories = {};
      result.template.forEach(function(category) {
        categories[category.type] = category.list;
      });

      this.samples = result.sample;
      this.categories = categories;

      if (argv && argv['template-list']) {
        for (var key in this.categories) {
          var categoryContent = this.categories[key];
          util.success(key);
          for (var template in categoryContent) {
            var currentTemplate = categoryContent[template];
            util.print('    ' + currentTemplate['repo_name']);
          }
          util.print('');
        }

        util.success('Samples');
        for (var key in this.samples) {
          var currentTemplate = this.samples[key];
          util.print('    ' + currentTemplate['repo_name']);
        }
        util.print('');
      } else {
        inquiry.categories.call(this);
      }
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
  },

  upload: function() {
    var deferred = Q.defer();

    inquirer.prompt({
      type: 'confirm',
      name: 'link',
      message: 'Do you want to link this project with Monaca IDE?',
      default: true
    }).then(function(answer) {
      if (answer.link) {
        return sync.run('upload', monacaInfo, {
          projectDir: path.resolve(dirName),
          force: true
        });
      }
    });
  }
};

module.exports = CreateTask;
})();
