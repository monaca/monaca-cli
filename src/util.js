(function() {
'use strict';

var Q = require('q'),
  fs = require('fs'),
  colors  =require('colors');

var UPDATE_INTERVAL = 21600; //6 hours

var _print = function(type, items) {
  var msg = '';
  for (var i = 0; i < items.length; i++) {
    msg += parseItem(items[i]);
  }

  process[type === 'error' ? 'stderr' : 'stdout'].write((type ? msg[type] : msg) + '\n');
};

var println = function() {
  _print('', arguments);
};

var printerr = function() {
  _print('error', arguments);
};

var printwarn = function() {
  _print('warn', arguments);
};

var printsuccess = function() {
  _print('success', arguments);
};

var fail = function() {
  _print('error', arguments);
  process.exit(1);
};

var parseItem = function(item) {
  item = item || '';
  switch (typeof item) {
    case 'object':
      return item.message || '';
    default:
      return item;
  }
};

var alignContent = function(str) {
  var indent = '    ';
  var middleSpace = ':    ';
  return indent + str + Array(17 - str.length).join(' ') + middleSpace;
};

var displayObjectKeys = function(object) {
  println(
    Object.keys(object).map(function(file, index) {
      return (index + 1) + '. ' + file;
    })
    .join('\n')
  );
};

var displayProgress = function(progress) {
  if (typeof progress === 'object' && progress !== null) {
    var per = 100 * (progress.index + 1) / progress.total;
    per = per.toString().substr(0, 5) + '%';
    println(('[' + per + '] ').verbose + progress.path);
  } else if (typeof progress === 'string') {
    process.stdout.write('.');
  }
};

var displayLoginErrors = function(error) {

  var deferred = Q.defer();

  if (error === 'ECONNRESET') {
    printerr('Unable to connect to Monaca Cloud.');
    println('Are you connected to the Internet?');
    println('If you need to use a proxy, please configure it with "monaca proxy".');
  } else {
    printerr('Must be signed in to Monaca when using this command.');
    println();
    println('Monaca account is free for the basic usage.');
    println('For more details, visit https://monaca.io/pricing.html')
    println();
    println('Starting Sign Up - use "monaca login" if you already have an account.')
    println();

    deferred.resolve({
      nextTask: {
        set: 'auth',
        name: 'signup'
      }
    });

  }

  return deferred.promise;
};

var displayHelp = function(taskName, taskList) {
  var task = taskList[taskName],
    i, desc;

  println('');

  if (!task) {
    printerr('No such task.');
    process.exit(1);
  }

  println('Usage: '.info + task.usage + '\n');

  if (task.aliases) {
    println('Aliases: '.info + taskName + ' | ' + task.aliases.join(' | ') + '\n');
  }

  if (task.longDescription) {
    var lines = [];

    desc = task.longDescription;
    println('Description:\n'.info);

    if (desc instanceof Array) {
      lines = desc;
    } else {
      lines = task.longDescription.split('\n');
    }

    for (i = 0; i < lines.length; i++) {
      var line = lines[i];

      println('  ' + line);
    }

    println('');
  }

  if (task.options) {
    println('Options:\n'.info);
    for (i = 0; i < task.options.length; i++) {
      var option = task.options[i],
        param = option[0],
        blank = new Array(30 - param.length).join(' ');

      desc = option[1];
      println('  ' + param + blank + desc);
    }

    println('');
  }

  if (task.examples) {
    println('Examples:\n'.info);

    for (i = 0; i < task.examples.length; i++) {
      var example = task.examples[i];

      println('  $ ' + example);
    }
  }

  println('');
};

var checkNodeRequirement = function() {
  if (Number(process.version.match(/^v(\d+\.\d+)/)[1]) < 6) {
    printwarn('\nWarning: your current Node version may not be compatible with the transpiling feature.');
    printwarn('Please consider updating your Node to version 6 or higher.\n');
  }
};

var printUpdate = function(newVersion) {
  println('\n------------------------------------------------------------------------------------'.help);
  println('Monaca CLI '.help + newVersion.help.bold + ' is now available. In order to update, run:'.help);
  println('                  npm install -g monaca '.success);
  println('------------------------------------------------------------------------------------\n'.help);
};

var updateCheck = function(data) {
  var currentDate = new Date();
  var newTime = currentDate.getTime().toString();
  var content = {};

  if (fs.existsSync(data.config)) {
    content = JSON.parse(fs.readFileSync(data.config, 'utf8'));
  }

  var lastUpdate = content['update_check_time'];

  content['update_check_time'] = newTime;

  if ((!lastUpdate || currentDate.getTime() > (lastUpdate + UPDATE_INTERVAL)) && data.latestVersion) {
    var compareVersions = require('compare-versions');
    var result = compareVersions(data.currentVersion, data.latestVersion);

    if (result === -1 && content) {
      printUpdate(data.latestVersion);
      fs.writeFileSync(data.config, JSON.stringify(content), 'utf-8');
    }
  }
};

var validatePassword = (password) => {
  if (password && password.length >= 6) {
    return true;
  } else {
    console.log('\nThe minimum length for this field is 6');
    return false;
  }
}

var validateEmail = (email) => {
  const emailValidation = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailValidation.test(email);
}

var validateCountryCode = (countryCode) => {
  if (countryCode && countryCode.length === 2) {
    return true;
  } else {
    return false;
  }
}

var validateRequireField = (text) => {
  if (text && text.length >= 1) {
    return true;
  } else {
    return false;
  }
}

var getFormatExpirationDate = (timestamp) => {
  if (!timestamp || timestamp < 0) return 'No Expiration Date';
  try {
    let d = new Date(timestamp * 1000);
    return d.toLocaleDateString();
  } catch (e) {
    return 'No Expiration Date';
  }
}

module.exports = {
  print: println,
  err: printerr,
  warn: printwarn,
  success: printsuccess,
  fail: fail,
  parseError: parseItem,
  displayProgress: displayProgress,
  displayObjectKeys: displayObjectKeys,
  displayLoginErrors: displayLoginErrors,
  displayHelp: displayHelp,
  checkNodeRequirement: checkNodeRequirement,
  updateCheck: updateCheck,
  alignContent: alignContent,
  validatePassword: validatePassword,
  validateEmail: validateEmail,
  validateCountryCode: validateCountryCode,
  validateRequireField: validateRequireField,
  getFormatExpirationDate: getFormatExpirationDate,
};
})();
