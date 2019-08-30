const os = require('os');
const path = require('path');

const platforms = {
  win32: 'win32',
  mac: 'darwin',
  linux: 'linux'
}

const normalizeFolderPath = (folderPath) => {
  folderPath = folderPath.replace('file:///', '').replace('file://', '').replace('file:/', '');

  const currentPlatform = os.platform();
  if (currentPlatform === platforms.mac || currentPlatform === platforms.linux) {
    folderPath = !folderPath.startsWith('/') && !folderPath.startsWith('~') && !folderPath.startsWith('.')
      ? ('/' + folderPath)
      : folderPath;
  }
  return path.normalize(folderPath);
}

module.exports = normalizeFolderPath;