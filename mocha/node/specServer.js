var repo = require("../../node.js")
var net = require("net")


var reposerv = net.createServer(function(c){
  global.repoSock = c
  console.log("got connection from repo")
})

reposerv.listen(6464, function(){
  console.log('listening for repo')
})


var testserv = net.createServer(function(c){
  c.pipe(global.repoSock)
  global.repoSock.pipe(c)
  console.log(c, global.repoSock)
})

testserv.listen(9999, function(){
  console.log('listening for testface')
})


repo.tangle('test', null, null, function(){console.log('tangled')})
