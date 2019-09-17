const loadJson = (path) => {
  if (path.includes('package.json')) {
    return {
      dependencies: { ...loadJson.mockDeps },
      cordova: { plugins: {} }
    }
  } else if (path.includes('fetch.json')) {
    return {};
  }
};

loadJson.mockDeps = {}

module.exports = loadJson;