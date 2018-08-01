const util = require('./util');
const lib = require('./lib');
const Monaca = require('monaca-lib').Monaca;
const inquirer = require('monaca-inquirer');

const URL = 'https://docs.monaca.io/en/products_guide/initialize'

let printInitInfo = (commands) => {
  util.warn('\nBefore using Monaca, take a look at the following points:');
  // www folder
  util.print(`A. Change the output folder to ${'www'.commands}.`);
  // config.xml
  util.print(`B. In case of not having a ${'config.xml'.commands} file, a new one has been created with Monaca's default settings.`); 
  // monaca commands
  util.print(`C. Some new commands have been added:\n`
    + `\t${'monaca:preview'.commands}: ${commands.serve.commands}\n`
    + `\t${'monaca:build'.commands}:   ${commands.build ? commands.build.commands : 'not transpile'}\n`
    + `\t${'monaca:debug'.commands}:   ${commands.watch ? commands.watch.commands : 'not transpile'}\n`
    + `   Make sure that the commands you have specified before are working properly because Monaca will need them.`);
  // public folder
  util.print(`D. Make sure that opening ${'index.html'.commands} over ${'file://'.commands} works. For example, you may need to change\n`
    + `\t- publicPath to ./  if you using webpack to build\n`
    + `\t- or set the <base href="./"> in the index.html\n`
    + `   Please consult the documentation for more details.`);
  // monaca loaders
  util.print(`E. Add the following lines into your ${'index.html'.commands}:\n`
    + `\t<!--Load selected JavaScript libraries-->\n`
    + `\t<script src="components/loader.js"></script>\n`
    + `\t<!--Load selected CSS libraries-->\n`
    + `\t<link rel="stylesheet" href="components/loader.css”>`);
  // plugins
  util.print(`F. Cordova plugins are managed by ${'package.json'.commands} file. If your plugin information is defined in ${'config.xml'.commands} file, you will need to import them again into Monaca.`);
  // monaca documentation url
  util.print(`G. More information about how to initialize other kind of projects at ${URL.url}`);
}

/**
 * Monaca Init commnads.
 *
 * @param {String}
 * @param {Object} info Info object with client type and version
 * @param {Object} options Info object with client type and version
 * @return
 */
module.exports = {
  run: (taskName, info) => {
    const confirmMessage = 'Are you sure you want to continue initializing this project?'
    let monaca = new Monaca(info);
    let commands = {}, isTranspile;

    util.warn(`Before trying to initialize your project, please take a look at ${URL} to get the basic information about how to do this process.`);
    return lib.confirmMessage(confirmMessage, true)
    .then(
        answer => {
          if (!answer.value) throw 'Init process stopped!';
          return inquirer.prompt({
            type: 'confirm',
            name: 'isTranspile',
            default: true,
            message: 'Is it a transpilable project?'
          });
        }
      )
      .then(
        answer => {
          isTranspile = answer.isTranspile;
          return inquirer.prompt(
            [{
                type: 'input',
                name: 'serve',
                message: 'Which command do you use to serve the app?',
                default: 'npm run dev'
              },
              {
                type: 'input',
                name: 'build',
                message: 'Which command do you use to build the app?',
                default: 'npm run build',
                when: isTranspile
              },
              {
                type: 'input',
                name: 'watch',
                message: 'Which command do you use to watch the changes from your app?',
                default: 'npm run watch',
                when: isTranspile
              }
            ]
          )
        }
      )
      .then(
        answers => {
          if (!answers) throw 'Error';
          commands['serve'] = isTranspile ? answers.serve.concat(' & ', answers.watch) : answers.serve;
          if (isTranspile) commands['build'] = answers.build;
          if (isTranspile) commands['watch'] = answers.watch;
          return monaca.init(process.cwd(), isTranspile, commands);
        }
      )
      .then(projectDir => {
        printInitInfo(commands);
        return projectDir;
      })
      .then(projectDir => util.success(`${taskName} process finished.`))
      .catch(err => util.fail(`Project ${taskName} failed. ${err}`))
  }
}