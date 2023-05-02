const fsExtra = require('fs-extra');
const request = require('request');
const execSync = require('child_process').execSync;
const path = require('path');
const loadJson = require('./load-json');
const getPluginNameFromXml = require('./get-plugin-name-from-xml');
const copyPluginToResources = require('./copy-plugin-to-resources');
const normalizeFolderPath = require('./normalize-folder-path');
const npmUtils = require('./npm-utils.js');

const isUrl = str => /^(git\+)*(http:\/\/|https:\/\/)/.test(str);
const isFile = str => /^file:/.test(str) || str.startsWith('/') || str.startsWith('~');

const isFileByFs = (str) => fsExtra.existsSync(str);

const installTypes = {
  file: 'file',
  url: 'url',
  npm: 'npm',
}

const supportedGitRepoTypes = {
  gitHub: 'gitHub',
  gitLab: 'gitLab',
}

const isGitHubRepo = url => url && url.startsWith && url.startsWith('https://github.com/');
const isGitLabRepo = url => url && url.startsWith && url.startsWith('https://gitlab.com/');

const pluginAlreadyExists = (pkgJsonPath, pluginName) => {
  const packageJson = loadJson(pkgJsonPath);
  return packageJson.dependencies[pluginName] !== undefined;
}

// Because the plugin is copied to plugins directory, this check is not necessary now.
const isPluginUnderTheProjectRoot = (projectDir, folder) => {
  const normalizedAbsProjectPath = path.resolve(projectDir);
  const normalizedFolderPath = path.resolve(folder);
  return !normalizedFolderPath.startsWith(normalizedAbsProjectPath);
}

const getPluginInfo = async (installType, pluginArg) => {
  let pluginName, pkgJsonDependencyValue;

  switch (installType) {
    case installTypes.file:
      const folder = normalizeFolderPath(pluginArg);
      pluginName = getPluginNameFromLocalFolder(folder);
      const relativeFolderPath = path.join('res', 'custom_plugins', pluginName).replace(/\\/g, "/");
      pkgJsonDependencyValue = `file:${relativeFolderPath}`;
      break;
    case installTypes.url:
      const repoUrl = pluginArg.endsWith('/') ? pluginArg.slice(0, -1) : pluginArg;
      const hash = getHashFromUrl(repoUrl);
      const repoUrlWithoutHash = getUrlWithoutHash(repoUrl);
      pluginName = await getPluginNameFromGitRepo(repoUrlWithoutHash, hash);
      pkgJsonDependencyValue = `git+${repoUrlWithoutHash}` + (hash ? `#${hash}` : '');
      break;
    default:
      const pluginVersion = getPluginVersionFromNpm(pluginArg);
      pluginName = await npmUtils.getPluginId(pluginArg);
      pkgJsonDependencyValue = `^${pluginVersion}`;
      break;
  }

  return { pluginName, pkgJsonDependencyValue };
}

const addPlugin = async (argv, projectDir) => {
  const pluginArg = argv[4];
  const pkgJsonPath = path.join(projectDir, 'package.json');

  if (canAddPlugin(pluginArg, pkgJsonPath)) {
    const installType = getInstallType(argv);
    const { pluginName, pkgJsonDependencyValue } = await getPluginInfo(installType, pluginArg);

    if (pluginAlreadyExists(pkgJsonPath, pluginName)) {
      throw new Error('Plugin has been added already: ' + pluginName);
    }

    if (installType === installTypes.file) {
      const srcFolder = normalizeFolderPath(pluginArg);
      copyPluginToResources(projectDir, srcFolder, pluginName);
    }

    addPluginToPackageJson(projectDir, pluginName, pkgJsonDependencyValue);
  }
}

const getInstallType = argv => {
  const pluginToInstall = argv[4];
  if (!pluginToInstall) {
    throw new Error('No plugin is specified.');
  }
  else if (isFile(pluginToInstall)) {
    return installTypes.file;
  } else if (isFileByFs(pluginToInstall)) {
    return installTypes.file;
  } else if (isUrl(pluginToInstall)) {
    return installTypes.url;
  } else {
    return installTypes.npm;
  }
}

const canAddPlugin = (pluginArg, pkgJsonPath) => {
  if (!pluginArg) {
    throw new Error('No plugin specified.');
  }
  if (!fsExtra.existsSync(pkgJsonPath)) {
    throw new Error(`Package.json does not exist. Path: ${pkgJsonPath}`);
  }
  return true;
}

const addPluginToPackageJson = (projectDir, pluginName, dependencyValue) => {
  const pkgJsonPath = path.join(projectDir, 'package.json');
  const packageJson = loadJson(pkgJsonPath);
  packageJson.dependencies[pluginName] = dependencyValue;
  packageJson.cordova.plugins[pluginName] = {};

  fsExtra.writeFileSync(pkgJsonPath, JSON.stringify(packageJson, null, 2));
}

const addPluginToFetchJson = (projectDir, pluginName, id) => {
  const pluginsFolderPath = path.join(projectDir, 'plugins');
  const fetchJsonPath = path.join(pluginsFolderPath, 'fetch.json');

  if (!fsExtra.existsSync(fetchJsonPath)) {
    fsExtra.mkdirpSync(pluginsFolderPath);
    fsExtra.writeJSONSync(fetchJsonPath, {});
  }

  const fetchJson = loadJson(fetchJsonPath);
  fetchJson[pluginName] = {
    source: {
      type: "registry",
      id: id
    },
    is_top_level: true,
    variables: {}
  }

  fsExtra.writeFileSync(fetchJsonPath, JSON.stringify(fetchJson, null, 2));
}

const getPluginNameFromLocalFolder = (folder) => {
  // - check local folder if it contains a plugin.xml
  // - get plugin name from plugin.xml
  const pluginXmlPath = path.join(folder, 'plugin.xml');
  if (!fsExtra.existsSync(pluginXmlPath)) {
    throw new Error(`Plugin.xml doesn't exists in the specified folder: ${folder}`)
  }
  var xml = fsExtra.readFileSync(pluginXmlPath, 'utf8').toString();
  return getPluginNameFromXml(xml);
}

const gitRepoType = url => {
  if (isGitHubRepo(url)) {
    return supportedGitRepoTypes.gitHub;
  }
  if (isGitLabRepo(url)) {
    return supportedGitRepoTypes.gitLab;
  }
  throw new Error('Only GitHub and GitLab is supported.')
}

const getRawFileFromGit = (urlWithoutHash, hash, filePath) => {
  let rawFileUrl;
  switch (gitRepoType(urlWithoutHash)) {
    case supportedGitRepoTypes.gitHub:
      // repo: https://github.com/apache/cordova-plugin-camera
      // file: https://github.com/apache/cordova-plugin-camera/blob/master/plugin.xml
      // raw : https://raw.githubusercontent.com/apache/cordova-plugin-camera/master/plugin.xml
      // file: https://github.com/apache/cordova-plugin-camera.git#4.1.0
      // raw : https://raw.githubusercontent.com/apache/cordova-plugin-camera.git/4.1.0/plugin.xml
      rawFileUrl = urlWithoutHash.replace('github.com', 'raw.githubusercontent.com') + `/${hash}/${filePath}`;
      break;
    case supportedGitRepoTypes.gitLab:
      // repo: https://gitlab.com/coldnight/flake8
      // file: https://gitlab.com/coldnight/flake8/blob/master/src/flake8/checker.py
      // raw : https://gitlab.com/coldnight/flake8/raw/master/src/flake8/checker.py
      rawFileUrl = `${urlWithoutHash}/raw/${hash}/${filePath}`;
      break;
    default:
      throw new Error('Only GitHub and GitLab repositories are supported.');
  }
  return new Promise((resolve, reject) => {
    request.get(rawFileUrl, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}

const getHashFromUrl = url => {
  if (url && url.includes && !url.includes('#')) {
    return;
  }
  const hashArr = url.split('#');
  return hashArr[hashArr.length - 1];
}

const getUrlWithoutHash = url => {
  const hash = getHashFromUrl(url);
  return hash ? url.replace(`#${hash}`, '') : url; // removing the hash from the url
}

const getPluginNameFromGitRepo = async (urlWithoutHash, hash = 'master') => {
  // - check git repository if it contains a plugin.xml
  // - get plugin name from plugin.xml
  // - check git repository if it contains a package.json
  let pluginXml, packageJson;
  const urlWithoutHashAndGitExtension = urlWithoutHash.replace('.git', '');
  try {
    pluginXml = await getRawFileFromGit(urlWithoutHashAndGitExtension, hash, 'plugin.xml');
    packageJson = await getRawFileFromGit(urlWithoutHashAndGitExtension, hash, 'package.json');
  } catch (e) {
    if (!pluginXml) {
      throw new Error('No plugin.xml was found in the git repository.')
    }
    if (!packageJson) {
      throw new Error('No package.json was found in the git repository.')
    }
  }
  return getPluginNameFromXml(pluginXml);
}

const getPluginVersionFromNpm = pluginName => {
  const command = `npm show ${pluginName} version`;
  return execSync(command, { encoding: 'utf8' }).trim();
}




module.exports = addPlugin;
