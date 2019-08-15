const fsExtra = require('fs-extra');
const path = require('path');

const removePlugin = (argv, projectDir) => {
  const pluginName = argv[4];

  const pkgJsonPath = path.join(projectDir, 'package.json');
  const packageJson = require(pkgJsonPath);
  delete packageJson.dependencies[pluginName];
  delete packageJson.cordova.plugins[pluginName];
  
  fsExtra.writeFileSync(pkgJsonPath, JSON.stringify(packageJson, null, 2));
  const targetFolder = path.join(projectDir, 'res', 'custom_plugins', pluginName);
  fsExtra.removeSync(targetFolder);
}

module.exports = removePlugin;