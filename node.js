var repo = {}
  , ndnr = require("./lib/ndn-repo.js")
  , down = false
  , streamTransport = ("ndn-streamTransport")

repo.ndnr = ndnr
repo.levelDown(false)

repo.tangle = function (streamTransport, writeableStream) {
  repo.ndnr.initFace(streamTransport, writeableStream)
}

