
// jest.mock('os', () => ({
//   currentPlatform: 'win32',
//   platform: () => this.currentPlatform,
//   setCurrentPlatform: (p) => { this.currentPlatform = p; }
// }))

const path = require('path');
const normalizeFolderPath = require('../normalize-folder-path');
const os = require('os');

const platforms = {
  win32: 'win32',
  mac: 'darwin',
  linux: 'linux'
};

const currentPlatform = os.platform();



describe('Tests for windows platform', () => {
  if (os.platform() != platforms.win32) {
    return;
  }

  test('Folder path starts with file:/', () => {
    const folderPath = 'file:/c:\\src\\localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('c:/src/localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });

  test('Folder path starts with file://', () => {
    const folderPath = 'file://c:\\src\\localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('c:/src/localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });

  test('Folder path starts with file:///', () => {
    const folderPath = 'file:///c:\\src\\localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('c:/src/localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });


  test('Folder path starts with /', () => {
    const folderPath = 'file:///dev/src/localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('dev/src/localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });

  test('Folder path starts with /./', () => {
    const folderPath = 'file:///./dev/src/localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('dev\\src\\localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });

  test('Folder path starts with ~', () => {
    const folderPath = 'file://~dev/src/localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('~dev\\src\\localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });
});

describe('Tests for linux platform', () => {

  // beforeAll(() => {
  //   os.setCurrentPlatform('linux');
  // });

  test('Folder path starts with file:/', () => {
    const folderPath = 'file://dev/src/localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('/dev/src/localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });

  test('Folder path starts with file://', () => {
    const folderPath = 'file:///dev/src/localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('/dev/src/localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });

  test('Folder path starts with file:///', () => {
    const folderPath = 'file:////dev/src/localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('/dev/src/localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });


  test('Folder path starts with /', () => {
    const folderPath = '/dev/src/localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('/dev/src/localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });

  test('Folder path starts with ./', () => {
    const folderPath = './dev/src/localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('dev/src/localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });

  test('Folder path starts with ~', () => {
    const folderPath = '~/dev/src/localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('~/dev/src/localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });
});

describe('Tests for mac platform', () => {

  // beforeAll(() => {
  //   os.setCurrentPlatform('darwin');
  // });

  test('Folder path starts with file:/', () => {
    const folderPath = 'file://dev/src/localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('/dev/src/localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });

  test('Folder path starts with file://', () => {
    const folderPath = 'file:///dev/src/localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('/dev/src/localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });

  test('Folder path starts with file:///', () => {
    const folderPath = 'file:////dev/src/localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('/dev/src/localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });


  test('Folder path starts with /', () => {
    const folderPath = '/dev/src/localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('/dev/src/localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });

  test('Folder path starts with ./', () => {
    const folderPath = './dev/src/localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('dev/src/localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });

  test('Folder path starts with ~', () => {
    const folderPath = '~/dev/src/localFile.txt';
    const normalizedPath = normalizeFolderPath(folderPath);
    const expectedPath = path.normalize('~/dev/src/localFile.txt');

    expect(normalizedPath).toBe(expectedPath);
  });
});

