module.exports = (path) => {
  if (path.includes('package.json')) {
    return {
      dependencies: {},
      cordova: { plugins: {} }
    }
  } else if (path.includes('fetch.json')) {
    return {};
  }
}; 