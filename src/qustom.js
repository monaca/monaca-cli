(function() {
  'use strict';

  var qustom = {};

  qustom.resolve = Promise.resolve.bind(Promise);
  qustom.reject = Promise.reject.bind(Promise);
  qustom.race = Promise.race.bind(Promise);
  qustom.all = Promise.all.bind(Promise);

  qustom.defer = function() {
    var deferred = {};
    deferred.promise = new Promise(
      function(resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
      }
    );

    return deferred;
  };

  module.exports = qustom;
})();
