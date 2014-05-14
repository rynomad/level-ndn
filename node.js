var repo = {}
  , ndnr = require("./lib/ndn-repo.js")
  , down = false

repo.ndnr = ndnr
repo.ndnr.levelDown(false)

repo.tangle = function (stringprefix, a1, a2, ack, firstcb) {
  repo.ndnr.initFace(stringprefix, null,null, ack, firstcb)
}

repo.init = repo.ndnr.init
module.exports = repo
