var repo = {}
  , ndnr = require("./lib/ndn-repo.js")
  , down = false

repo.ndnr = ndnr
repo.ndnr.levelDown(false)

repo.tangle = function (stringprefix, a1, a2, ack) {
  repo.ndnr.initFace(stringprefix, null,null, ack)
}

if (process.argv.length > 2) {
  console.log('argv[2] ', process.argv[2] )
  repo.tangle(process.argv[2], null, null, function(){ console.log("repo tangled")})
}

module.exports = repo
