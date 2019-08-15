const fsExtra = require('fs-extra');
const path = require('path');

const copyPluginToResources = (projectDir, pluginPath, pluginName) => {
 const targetFolder = path.join(projectDir, 'res', 'custom_plugins', pluginName);
 fsExtra.mkdirpSync(targetFolder);
 fsExtra.copySync(pluginPath, targetFolder);
}

module.exports = copyPluginToResources;