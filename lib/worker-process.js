var proc = {}
module.exports = proc;
var msCh = new MessageChannel()

var queue = [];
msCh.port1.onmessage = function(ev) {
  var source = ev.source;
  if ( ev.data === 'proc-tick') {
    if (queue.length > 0) {
      var fn = queue.shift();
      fn();
    }
  }
}
proc.nextTick = function nextTick(fn) {
      queue.push(fn);
      msCh.port2.postMessage('proc-tick');
    };

