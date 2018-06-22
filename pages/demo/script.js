/**
 * Get content from a given parameter name
 *
 * @param {String} parameterName Parameter Name
 *
 * @return {String}
 */
function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split('&')
        .forEach(function (item) {
          tmp = item.split('=');
          if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

// Get the WebPack port
var PORT = findGetParameter('WEBPACK_PORT');
PORT = PORT !== null ? 'http://127.0.0.1:' + PORT : '';

// Modify the iframe source for each platform
window.onload = function() {
    document.querySelector('#iosIframe').src = PORT + '/?platform=ios';
    document.querySelector('#androidIframe').src = PORT + '/?platform=android';
};