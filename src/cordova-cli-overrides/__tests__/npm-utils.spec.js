const path = require('path');
const fsExtra = require('fs-extra');

const mockPluginBuffer = fsExtra.readFileSync(path.resolve(__dirname, 'fixtures', 'cordova-plugin-camera-4.1.0.tgz'));

jest.mock('child_process', () => {
  return {
    exec: (command, options, cb) => {
      cb(null, 'https://registry.npmjs.org/cordova-plugin-camera/-/cordova-plugin-camera-4.1.0.tgz', null);
    }
  }
});

jest.mock('request', () => {

  return {
    get: jest.fn((url, cb) => {
      const stream = require('stream');

      class MockReadable extends stream.Readable {
        constructor () {
          super();
          this.readed = false;
        }
        _read (size) {
          if (!this.readed) {
            const buf = mockPluginBuffer;
            this.push(buf);
            this.readed = true;
          } else {
            this.emit('response', { statusCode: 200 });
            this.push(null);
          }
        }
      };
      return new MockReadable();
    })
  }
});

const npmUtils = require('../npm-utils');

test('Works', () => {
  expect(true).toBeTruthy();
});

test('Request tarball', async () => {
  const url = 'https://registry.npmjs.org/cordova-plugin-camera/-/cordova-plugin-camera-4.1.0.tgz';
  const text = await npmUtils.getFileFromTarballUrl(url, 'package/plugin.xml');
  expect(text).not.toBeNull();
});

// test('Plugin Id', async () => {
//   const pluginid = await npmUtils.getPluginId('cordova-plugin-camera');
//   expect(pluginid).toBe('cordova-plugin-camera');
// });
