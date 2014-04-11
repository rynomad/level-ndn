self.window = ""
var process = {}
self.ndnr = require("./ndn-repo.js")
var down = require("level-js")
  , ms = require("ndn-messageChannelTransport")
process.nextTick = require("./worker-process.js")

ndnr.levelDown(down)

function onAck(){
  self.postMessage("repo tangled")  
}

self.onmessage = function(e){
  var uri = e.data.uri,
      port = e.ports[0]
  console.log('got message')
  ndnr.initFace(uri, ms, port, onAck)
};
