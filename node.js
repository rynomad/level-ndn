var repo = {}
  , ndnr = require("./lib/ndn-repo.js")
  , down = false
  , streamTransport = ("ndn-streamTransport")

repo.ndnr = ndnr
repo.ndnr.levelDown(false)

repo.tangle = function (stringprefix, a1, a2, ack) {
  repo.ndnr.initFace(stringprefix, null,null, ack)
}

module.exports = repo
