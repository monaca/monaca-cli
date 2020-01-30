const os = require('os');
const path = require('path');

const platforms = {
  win32: 'win32',
  mac: 'darwin',
  linux: 'linux'
}

const normalizeFolderPath = (folderPath) => {

  const currentPlatform = os.platform();
  const pathPrefix = (currentPlatform === platforms.mac || currentPlatform === platforms.linux) ? '/' : '';

  const simplePath = folderPath.replace('file:///', pathPrefix).replace('file://', pathPrefix).replace('file:/', pathPrefix);
  return path.normalize(simplePath);
}

module.exports = normalizeFolderPath;