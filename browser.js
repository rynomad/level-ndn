var repo = {}
repo.ndnr = new Worker("./lib/worker.js") 

repo.tangle = function(port) {
  repo.ndnr.postMessage({uri: ""}, [port])
}

module.exports = repo

