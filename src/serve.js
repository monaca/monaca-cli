'use strict';

let path = require('path');
let exec = require('child_process').exec;
let util = require(path.join(__dirname, 'util'));
let lib = require(path.join(__dirname, 'lib'));
let Monaca = require('monaca-lib').Monaca;

let ServeTask = {},
  monaca;

ServeTask.run = function (taskName, info) {

  monaca = new Monaca(info);

  lib.findProjectDir(process.cwd(), monaca)
    .then(
      function (dir) {
        let projectDir = dir; let projectConfig;

        try {
          projectConfig = require(path.join(projectDir, 'package.json'));
        } catch (err) {
          // TODO:
          uti.fail('package.json is missing.');
        }

        if (projectConfig && projectConfig.scripts) {
          let childProcess = exec(`npm run monaca:preview`);

          childProcess.stdout.on('data', function (data) {
            process.stdout.write(data.toString());
          });

          childProcess.stderr.on('data', function (data) {
            if (data) {
              process.stderr.write(data.toString().error);
            }
          });
        } else {
          // TODO:
          util.fail('You need to define the scripts command into package.json file following Monaca CLI templates.');
        }
      }
    )
    .catch(util.fail.bind(null, 'Project ' + taskName + ' failed: '));

};

module.exports = ServeTask;