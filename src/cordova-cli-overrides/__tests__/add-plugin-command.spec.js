jest.mock('../copy-plugin-to-resources');
jest.mock('request', () => ({
  get: jest.fn((url, cb) => {
    const error = url === 'https://gitlab.com/cordova-plugins/cordova-bluetoothsco/raw/master/package.json';
    cb(error, { statusCode: 200 }, url);
  }),
}));

jest.mock('fs-extra', () => ({
  existsSync: (path) => [
    'temp\\',
    'temp\\package.json',
    'temp\\plugin.xml',
    'temp\\plugins\\fetch.json',
    `localPath\\plugin.xml`,
    `\\localPath\\plugin.xml`,
    `~\\localPath\\plugin.xml`,
  ].includes(path),
  mkdirpSync: jest.fn(),
  writeJSONSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: () => jest.fn(),
}));

jest.mock('../get-plugin-name-from-xml', () => jest.fn());
jest.mock('../load-json');

jest.mock('os', () => ({
  currentPlatform: 'win32',
  platform: () => this.currentPlatform,
  setCurrentPlatform: (p) => { this.currentPlatform = p; }
}))

const copy = require('../copy-plugin-to-resources');
const addPlugin = require('../add-plugin-command');
const getPluginNameFromXml = require('../get-plugin-name-from-xml');
const request = require('request');
const fsExtra = require('fs-extra');
const path = require('path');

test('Works', () => {
  expect(true).toBeTruthy();
});
test('Test copyPluginToResources', () => {
  copy('foo');
  expect(copy).toHaveBeenCalledWith('foo');
  copy.mockClear();
});


afterEach(() => {
  fsExtra.writeFileSync.mockClear();
  request.get.mockClear();
  copy.mockClear();
})

const projectDir = 'temp';
const expectedPkgJsonPath = path.join(projectDir, 'package.json');

describe('Add plugin from local folder', () => {
  describe('Argument starts with file:/', () => {
    const pluginName = "cordova-plugin-camera";
    const projectDir = 'temp';
    const folder = "localPath"
    const expectedPkgJsonPath = path.join(projectDir, 'package.json');
    const expectedFetchJsonPath = path.join(projectDir, 'plugins', 'fetch.json');
    getPluginNameFromXml.mockReturnValue(pluginName);

    test('Copy has been called and Pakcage.json has been updated correctly', async () => {

      await addPlugin([
        "node",
        "monaca",
        "plugin",
        "add",
        `file:/${folder}`
      ],
        projectDir
      );

      expect(copy).toHaveBeenCalledWith(projectDir, folder, pluginName);

      expect(fsExtra.writeFileSync.mock.calls[0][0]).toBe(expectedPkgJsonPath);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).dependencies).toHaveProperty(pluginName, `file:../${folder}`);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).cordova.plugins).toHaveProperty(pluginName, {});
    });

    test.skip('fetch.json has been updated correctly', async () => {

      await addPlugin([
        "node",
        "monaca",
        "plugin",
        "add",
        `file:/${folder}`
      ],
        projectDir
      );

      expect(fsExtra.writeFileSync.mock.calls[1][0]).toBe(expectedFetchJsonPath);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[1][1])).toHaveProperty(pluginName, 'source.type', 'registry');
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[1][1])).toHaveProperty(pluginName, 'source.id', `file:/${folder}`);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[1][1])).toHaveProperty(pluginName, 'variables', {});
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[1][1])).toHaveProperty(pluginName, 'isTopLevel', true);
    });
  });

  describe('Argument starts with file://', () => {
    const pluginName = "cordova-plugin-camera";
    const projectDir = 'temp';
    const folder = "localPath"
    const expectedPkgJsonPath = path.join(projectDir, 'package.json');
    const expectedFetchJsonPath = path.join(projectDir, 'plugins', 'fetch.json');
    getPluginNameFromXml.mockReturnValue(pluginName);
    test('Copy has been called and Package.json has been updated correctly', async () => {

      await addPlugin([
        "node",
        "monaca",
        "plugin",
        "add",
        `file://${folder}`
      ],
        projectDir
      );

      expect(copy).toHaveBeenCalledWith(projectDir, folder, pluginName);

      expect(fsExtra.writeFileSync.mock.calls[0][0]).toBe(expectedPkgJsonPath);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).dependencies).toHaveProperty(pluginName, `file:../${folder}`);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).cordova.plugins).toHaveProperty(pluginName, {});
    });

    test.skip('fetch.json has been updated correctly', async () => {

      await addPlugin([
        "node",
        "monaca",
        "plugin",
        "add",
        `file://${folder}`
      ],
        projectDir
      );

      expect(fsExtra.writeFileSync.mock.calls[1][0]).toBe(expectedFetchJsonPath);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[1][1])).toHaveProperty(pluginName, 'source.type', 'registry');
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[1][1])).toHaveProperty(pluginName, 'source.id', `file://${folder}`);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[1][1])).toHaveProperty(pluginName, 'variables', {});
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[1][1])).toHaveProperty(pluginName, 'isTopLevel', true);
    });
  });

  describe('Argument starts with file:///', () => {
    const pluginName = "cordova-plugin-camera";
    const projectDir = 'temp';
    const folder = "localPath"
    const expectedPkgJsonPath = path.join(projectDir, 'package.json');
    const expectedFetchJsonPath = path.join(projectDir, 'plugins', 'fetch.json');
    getPluginNameFromXml.mockReturnValue(pluginName);
    test('Copy has been called and Pakcage.json has been updated correctly', async () => {

      await addPlugin([
        "node",
        "monaca",
        "plugin",
        "add",
        `file:///${folder}`
      ],
        projectDir
      );

      expect(copy).toHaveBeenCalledWith(projectDir, folder, pluginName);

      expect(fsExtra.writeFileSync.mock.calls[0][0]).toBe(expectedPkgJsonPath);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).dependencies).toHaveProperty(pluginName, `file:../${folder}`);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).cordova.plugins).toHaveProperty(pluginName, {});
    });

    test.skip('fetch.json has been updated correctly', async () => {

      await addPlugin([
        "node",
        "monaca",
        "plugin",
        "add",
        `file://${folder}`
      ],
        projectDir
      );

      expect(fsExtra.writeFileSync.mock.calls[1][0]).toBe(expectedFetchJsonPath);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[1][1])).toHaveProperty(pluginName, 'source.type', 'registry');
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[1][1])).toHaveProperty(pluginName, 'source.id', `file://${folder}`);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[1][1])).toHaveProperty(pluginName, 'variables', {});
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[1][1])).toHaveProperty(pluginName, 'isTopLevel', true);
    });
  });

  describe('Argument starts with /', () => {
    const pluginName = "cordova-plugin-camera";
    const projectDir = 'temp';
    const folder = "/localPath"
    const expectedPkgJsonPath = path.join(projectDir, 'package.json');
    const expectedFetchJsonPath = path.join(projectDir, 'plugins', 'fetch.json');
    getPluginNameFromXml.mockReturnValue(pluginName);

      test('Copy has been called and Pakcage.json has been updated correctly', async () => {

        await addPlugin([
          "node",
          "monaca",
          "plugin",
          "add",
          `${folder}`
        ],
          projectDir
        );

        expect(copy).toHaveBeenCalledWith(projectDir, path.normalize(folder), pluginName);

        expect(fsExtra.writeFileSync.mock.calls[0][0]).toBe(expectedPkgJsonPath);
        expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).dependencies).toHaveProperty(pluginName, `file:../../../..${folder}`);
        expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).cordova.plugins).toHaveProperty(pluginName, {});
      });

      test.skip('fetch.json has been updated correctly', async () => {

        await addPlugin([
          "node",
          "monaca",
          "plugin",
          "add",
          `file://${folder}`
        ],
          projectDir
        );

        expect(fsExtra.writeFileSync.mock.calls[1][0]).toBe(expectedFetchJsonPath);
        expect(JSON.parse(fsExtra.writeFileSync.mock.calls[1][1])).toHaveProperty(pluginName, 'source.type', 'registry');
        expect(JSON.parse(fsExtra.writeFileSync.mock.calls[1][1])).toHaveProperty(pluginName, 'source.id', `file://${folder}`);
        expect(JSON.parse(fsExtra.writeFileSync.mock.calls[1][1])).toHaveProperty(pluginName, 'variables', {});
        expect(JSON.parse(fsExtra.writeFileSync.mock.calls[1][1])).toHaveProperty(pluginName, 'isTopLevel', true);
      });
   
  });

  describe('Argument starts with ~', () => {
    const pluginName = "cordova-plugin-camera";
    const projectDir = 'temp';
    const folder = "~/localPath"
    const expectedPkgJsonPath = path.join(projectDir, 'package.json');
    const expectedFetchJsonPath = path.join(projectDir, 'plugins', 'fetch.json');
    getPluginNameFromXml.mockReturnValue(pluginName);
    test('Copy has been called and Pakcage.json has been updated correctly', async () => {

      await addPlugin([
        "node",
        "monaca",
        "plugin",
        "add",
        `${folder}`
      ],
        projectDir
      );

      expect(copy).toHaveBeenCalledWith(projectDir, path.normalize(folder), pluginName);

      expect(fsExtra.writeFileSync.mock.calls[0][0]).toBe(expectedPkgJsonPath);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).dependencies).toHaveProperty(pluginName, `file:../${folder}`);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).cordova.plugins).toHaveProperty(pluginName, {});
    });
  });
});

describe('Add plugin from GitHub', () => {
  test('Default case: https://github.com/apache/cordova-plugin-camera/', async () => {
    const pluginName = "cordova-plugin-camera";
    const gitUrl = 'https://github.com/apache/cordova-plugin-camera/';
    const rawFileUrl = 'https://raw.githubusercontent.com/apache/cordova-plugin-camera/master/plugin.xml'
    const expectedDependencyValue = 'git+https://github.com/apache/cordova-plugin-camera';

    getPluginNameFromXml.mockReturnValue(pluginName);

    await addPlugin([
      "node",
      "monaca",
      "plugin",
      "add",
      gitUrl
    ],
      projectDir
    );
    expect(request.get.mock.calls[0][0]).toBe(rawFileUrl);

    expect(fsExtra.writeFileSync.mock.calls[0][0]).toBe(expectedPkgJsonPath);
    expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).dependencies).toHaveProperty(pluginName, expectedDependencyValue);
    expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).cordova.plugins).toHaveProperty(pluginName, {});
  });

  test('Specific github branch:  https://github.com/apache/cordova-plugin-camera#4.1.0', async () => {
    const pluginName = "cordova-plugin-camera";
    const gitUrl = 'https://github.com/apache/cordova-plugin-camera#4.1.0';
    const rawFileUrl = 'https://raw.githubusercontent.com/apache/cordova-plugin-camera/4.1.0/plugin.xml'
    const expectedDependencyValue = 'git+https://github.com/apache/cordova-plugin-camera#4.1.0';

    getPluginNameFromXml.mockReturnValue(pluginName);

    await addPlugin([
      "node",
      "monaca",
      "plugin",
      "add",
      gitUrl
    ],
      projectDir
    );
    expect(request.get.mock.calls[0][0]).toBe(rawFileUrl);

    expect(fsExtra.writeFileSync.mock.calls[0][0]).toBe(expectedPkgJsonPath);
    expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).dependencies).toHaveProperty(pluginName, expectedDependencyValue);
    expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).cordova.plugins).toHaveProperty(pluginName, {});
  });

  test('Specific github branch with .git in the url:  https://github.com/apache/cordova-plugin-camera#4.1.0',
    async () => {
      const pluginName = "cordova-plugin-camera";
      const gitUrl = 'https://github.com/apache/cordova-plugin-camera.git#4.1.0';
      const rawFileUrl = 'https://raw.githubusercontent.com/apache/cordova-plugin-camera/4.1.0/plugin.xml'
      const expectedDependencyValue = 'git+https://github.com/apache/cordova-plugin-camera.git#4.1.0';

      getPluginNameFromXml.mockReturnValue(pluginName);

      await addPlugin([
        "node",
        "monaca",
        "plugin",
        "add",
        gitUrl
      ],
        projectDir
      );
      expect(request.get.mock.calls[0][0]).toBe(rawFileUrl);

      expect(fsExtra.writeFileSync.mock.calls[0][0]).toBe(expectedPkgJsonPath);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).dependencies).toHaveProperty(pluginName, expectedDependencyValue);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).cordova.plugins).toHaveProperty(pluginName, {});
    });


});

describe('Add plugin from GitLab', () => {
  test('Default case: https://gitlab.com/creare-com/cordova-plugin-creare-tabsintreceiver', async () => {
    const pluginName = "cordova-plugin-camera";
    const gitUrl = 'https://gitlab.com/creare-com/cordova-plugin-creare-tabsintreceiver';
    const rawFileUrl = 'https://gitlab.com/creare-com/cordova-plugin-creare-tabsintreceiver/raw/master/plugin.xml'
    const expectedDependencyValue = 'git+https://gitlab.com/creare-com/cordova-plugin-creare-tabsintreceiver';

    getPluginNameFromXml.mockReturnValue(pluginName);

    await addPlugin([
      "node",
      "monaca",
      "plugin",
      "add",
      gitUrl
    ],
      projectDir
    );
    expect(request.get.mock.calls[0][0]).toBe(rawFileUrl);

    expect(fsExtra.writeFileSync.mock.calls[0][0]).toBe(expectedPkgJsonPath);
    expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).dependencies).toHaveProperty(pluginName, expectedDependencyValue);
    expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).cordova.plugins).toHaveProperty(pluginName, {});
  });

  test('Specific gitlab hash: https://gitlab.com/creare-com/cordova-plugin-creare-tabsintreceiver#cc0a604d643107f426ae35276fbe7dfaac435105', async () => {
    const pluginName = "cordova-plugin-camera";
    const gitUrl = 'https://gitlab.com/creare-com/cordova-plugin-creare-tabsintreceiver#cc0a604d643107f426ae35276fbe7dfaac435105';
    const rawFileUrl = 'https://gitlab.com/creare-com/cordova-plugin-creare-tabsintreceiver/raw/cc0a604d643107f426ae35276fbe7dfaac435105/plugin.xml'
    const expectedDependencyValue = 'git+https://gitlab.com/creare-com/cordova-plugin-creare-tabsintreceiver#cc0a604d643107f426ae35276fbe7dfaac435105';

    getPluginNameFromXml.mockReturnValue(pluginName);

    await addPlugin([
      "node",
      "monaca",
      "plugin",
      "add",
      gitUrl
    ],
      projectDir
    );
    expect(request.get.mock.calls[0][0]).toBe(rawFileUrl);

    expect(fsExtra.writeFileSync.mock.calls[0][0]).toBe(expectedPkgJsonPath);
    expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).dependencies).toHaveProperty(pluginName, expectedDependencyValue);
    expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).cordova.plugins).toHaveProperty(pluginName, {});
  });

  test('Specific github branch with .git in the url:  https://gitlab.com/creare-com/cordova-plugin-creare-tabsintreceiver.git#cc0a604d643107f426ae35276fbe7dfaac43510',
    async () => {
      const pluginName = "cordova-plugin-camera";
      const gitUrl = 'https://gitlab.com/creare-com/cordova-plugin-creare-tabsintreceiver.git#cc0a604d643107f426ae35276fbe7dfaac43510';
      const rawFileUrl = 'https://gitlab.com/creare-com/cordova-plugin-creare-tabsintreceiver/raw/cc0a604d643107f426ae35276fbe7dfaac43510/plugin.xml'
      const expectedDependencyValue = 'git+https://gitlab.com/creare-com/cordova-plugin-creare-tabsintreceiver.git#cc0a604d643107f426ae35276fbe7dfaac43510';

      getPluginNameFromXml.mockReturnValue(pluginName);

      await addPlugin([
        "node",
        "monaca",
        "plugin",
        "add",
        gitUrl
      ],
        projectDir
      );
      expect(request.get.mock.calls[0][0]).toBe(rawFileUrl);

      expect(fsExtra.writeFileSync.mock.calls[0][0]).toBe(expectedPkgJsonPath);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).dependencies).toHaveProperty(pluginName, expectedDependencyValue);
      expect(JSON.parse(fsExtra.writeFileSync.mock.calls[0][1]).cordova.plugins).toHaveProperty(pluginName, {});
    });


});

describe('Error cases', () => {
  test('Unsupported repo type or url: https://google.com/', async () => {
    const pluginName = "cordova-plugin-camera";
    const gitUrl = 'https://google.com/';

    getPluginNameFromXml.mockReturnValue(pluginName);
    expect.assertions(1);
    try {
      await addPlugin([
        "node",
        "monaca",
        "plugin",
        "add",
        gitUrl
      ], projectDir);
    }
    catch (e) {
      expect(e.message).toEqual('No plugin.xml was found in the git repository.');
    }
  });

  test('No package.json found in git repository', async () => {
    const pluginName = "cordova-plugin-camera";
    const gitUrl = 'https://gitlab.com/cordova-plugins/cordova-bluetoothsco';

    getPluginNameFromXml.mockReturnValue(pluginName);
    expect.assertions(1);
    try {
      await addPlugin([
        "node",
        "monaca",
        "plugin",
        "add",
        gitUrl
      ], projectDir);
    }
    catch (e) {
      expect(e.message).toEqual('No package.json was found in the git repository.');
    }
  });

});
