const path = require('path');
const util = require(path.join(__dirname, 'util'));
const lib = require(path.join(__dirname, 'lib'));
const Monaca = require('monaca-lib').Monaca;

let TranspileTask = {}; let monaca;

TranspileTask.run = function(taskName, info) {
  let projectDir;
  monaca = new Monaca(info);

  lib.findProjectDir(process.cwd(), monaca)
  // Checking if the user needs to upgrade the project
  .then(
    (dir) => {
      projectDir= dir;
      if (!monaca.isTranspilable(projectDir)) util.fail('This project is not transpilable.'); 
      lib.needToUpgrade(projectDir, monaca);
      let report = {
        event: 'transpile'
      };
    
      monaca.reportAnalytics(report);
    
      let isTranspileEnabled = monaca.isTranspileEnabled(projectDir);
    
      if (isTranspileEnabled) {
        util.checkNodeRequirement();
      }

    return monaca.transpile(projectDir)
      .then(
        monaca.reportFinish.bind(monaca, report),
        monaca.reportFail.bind(monaca, report)
      )
      .then(
        util.success.bind(null),
        util.fail.bind(null, 'Project has failed to transpile. ')
      );

    }
  )
  .catch(util.fail.bind(null, 'Project ' + taskName + ' failed: '));
};

module.exports = TranspileTask;
