var ndnr = require("./ndn-repo.js")
  , down = require("level-js")
  , ms = require("ndn-messageChannelTransport")


ndnr.levelDown(down)

onmessage = function(e){
  var uri = e.data.uri,
      port = e.ports[0]
  ndnr.initFace(ms, port)
};
