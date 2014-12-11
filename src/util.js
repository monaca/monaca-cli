(function() {
  'use strict';

  var println = function(msg) {
    process.stdout.write(msg + '\n');
  };

  var printerr = function(msg) {
    process.stderr.write(msg.error + '\n');
  }

  var printwarn = function(msg) {
    process.stderr.write(msg.warn + '\n');
  }

  module.exports = {
    print: println,
    err: printerr,
    warn: printwarn
  };
})();
