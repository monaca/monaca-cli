const exec = require('child_process').exec;
const request = require('request');
const tar = require('tar');
const XMLDom = require('xmldom').DOMParser;


const getPluginId = async (pkgname) => {
  const pluginxml = await getPluginXml(pkgname);
  const doc = new XMLDom().parseFromString(pluginxml, 'application/xml');
  try {
    const pluginid = doc.getElementsByTagName('plugin')[0].getAttribute('id');
    return pluginid;
  } catch (error) {
    throw 'plugin.xml is wrong';
  }
};

const getPluginXml = async (pkgname) => {
  if (! validatePackageName(pkgname)) {
    throw 'Invalid package name'
  }
  const tarballUrl = await getTarballUrl(pkgname);
  const pluginxml = getFileFromTarballUrl(tarballUrl, 'package/plugin.xml');
  return pluginxml;

};

const getFileFromTarballUrl = async (url, filepath) => {
  return new Promise((resolve, reject) => {
    let called = false;
    let result = null;
    request.get(url)
    .on('response', (res) => {
      // console.log('status code = ' + res.statusCode);
    })
    .on('error', (err) => {
      reject('Can\'t connect to the url ' + url);
    })
    .pipe(
      tar.x({
        filter: (path, entry) => (path === filepath)
      })
      .on('entry', (entry) => {
        // console.log('entry is ok');
        entry.pipe(new TextStream((text) => {
          called = true;
          result = text;
        }));
      })
      .on('end', () => {
        if (called) {
          resolve(result);
        } else {
          reject('Can\'t find or extract file ' + filepath);
        }
      })
    );
  });
};

const getTarballUrl = async (pkgname) => { // ex. cordova-plugin-camera or cordova-plugin-camera@4.1.0
  return new Promise((resolve, reject) => {
    const command = 'npm view ' + pkgname + ' dist.tarball';
    const options =  { encoding: 'utf8' };
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject('Can\'t find ' + pkgname);
        return;
      }
      const result = stdout.trim();
      resolve(result);
    });
  });
  
};

const validatePackageName = (pkgname) => {
  return pkgname.match(/[a-zA-Z0-9@_.]/) && pkgname.length > 0;
}

const stream = require('stream');

class TextStream extends stream.Writable {
  constructor (cb) {
    super();
    this.buf = [];
    this.cb = cb;
  }

  _write(chunk, encoding, callback) {
    this.buf.push(chunk.toString());
    callback();
  }

  _final (callback) {
    this.cb(this.buf.join(''));
    callback();
  }
};


module.exports = {
  getPluginId: getPluginId,
  getPluginXml: getPluginXml,
  getFileFromTarballUrl: getFileFromTarballUrl,
  getTarballUrl: getTarballUrl,
  validatePackageName: validatePackageName,
  TextStream: TextStream
}



