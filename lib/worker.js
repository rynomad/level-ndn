self.window = ""
var process = {}
  , ndnr = require("./ndn-repo.js")
  , down = require("level-js")
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
  ndnr.initFace(ms, port, onAck)
};
