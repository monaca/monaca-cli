const path = require('path');

const listPlugins = (argv, projectDir) => {
  const pkgJsonPath = path.join(projectDir, 'package.json');
  const packageJson = require(pkgJsonPath);
  const plugins = packageJson.cordova.plugins;
  const deps = packageJson.dependencies;

  Object.keys(plugins).forEach((name) => {
    console.log(name + ':' + deps[name]);
  });
}
const isPluginInPackageJson = (pluginName, projectDir) => {
  const pkgJsonPath = path.join(projectDir, 'package.json');
  const packageJson = require(pkgJsonPath);
  return packageJson.cordova && packageJson.cordova.plugins && pluginName in packageJson.cordova.plugins;
};


module.exports = { listPlugins, isPluginInPackageJson };

