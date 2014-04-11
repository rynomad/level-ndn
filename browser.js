var repo = {}
repo.ndnr = new Worker("./lib/worker.js") 

repo.ack = null
repo.tangle = function(port, onAck) {
  repo.ack = onAck
  repo.ndnr.postMessage({uri: ""}, [port])
}
repo.ndnr.onmessage = function (response) {
  repo.ack()
}

module.exports = repo

