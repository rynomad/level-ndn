var repo = require('../../node.js')
  , ndn = require('ndn-lib')

var fa = new ndn.Face({host:1, port:1})
var RegisteredPrefix = function(prefix, closure) {this.prefix = new ndn.Name(prefix); this.closure = closure}
var net = require('net')
var tcpServ = require('../../../tcpServerTransport/tcpServerTransport.js').serverTcpTransport

function onInterest (prefix,interest,transport){
  global.gotInterest = true
  console.log("got interest", prefix)
  var d = new ndn.Data(new ndn.Name(interest.name.toUri()), new ndn.SignedInfo(), "success")
  d.signedInfo.setFinalBlockID(new ndn.Name.Component([0x00]))
  d.signedInfo.setFields()

  var encoded = d.wireEncode()
  console.log("sending encoded" )
  transport.send(encoded.buffer)
}
var server = net.createServer(function(c) {
  console.log('connected')
  var s = {}
  s.trans = new tcpServ(c)
  global.face = new ndn.Face({host: 1, port: 1, getTransport: function(){return s.trans}})
  face.transport.connect(face, function(){})

  var closure = new ndn.Face.CallbackClosure(null, null, onInterest, 'test', face.transport)
  ndn.Face.registeredPrefixTable.push(new RegisteredPrefix('test', closure))
  console.log(face)
})

server.listen(6464, function(){
  console.log('serverbound')
})

describe('ping', function(){
  it('should tangle', function(done){
    repo.tangle('test', null, null, function(){done()})
  })
  it('should respond to write request with dummy data', function(done){
    var command = new ndn.Name("test").append(new ndn.Name.Component([0xc1, 0x2e, 0x52, 0x2e, 0x73, 0x77]))
    var interest = new ndn.Interest(command)
    interest.setInterestLifetimeMilliseconds(1000)
    function onData(interest, data){
      if (data.content.toString() == "content storage request recieved")
      {done()}
    }
    function onTimeout(interest, something){
      console.log('fail')
    }
    console.log(interest)
    face.expressInterest(interest, onData, onTimeout)


  })
  it('should send an Interest to fetch the data', function(done){
  this.timeout(10000)
  function check(){
    if (global.gotInterest != true){
      setTimeout(check, 100)
    } else {
      done()
    }
  }
  check()
  })
  it('should respond to Interest with data', function(done){
    this.timeout(10000)
    var n = new ndn.Name("test")
    var inst = new ndn.Interest(n)
    inst.setInterestLifetimeMilliseconds(1000)
    function onData(interest, data){
      if (data.content.toString() == "success"){
        done()
      }
    }
    function onTimeout(interest, something){
      console.log('fail')
    }
    face.expressInterest(inst, onData, onTimeout)
  })


})
/*

describe('Setup', function(){
  describe('should tangle', function(){
    
    it('with messageChannel', function(done){
      this.timeout(10000)
      function cb (){ done()}
      repo.tangle("test", ms.port1, cb)
    })
  })
})

describe('Storage Interface', function(){
    var command = new ndn.Name.Component([0xc1, 0x2e, 0x52, 0x2e, 0x73, 0x77])
    var na = new ndn.Name('test')
    na.append(command)
    var interest = new ndn.Interest(na)
    interest.setInterestLifetimeMilliseconds(1000)
    function onData(interest, data){
      if (data.content.toString() == "content storage request recieved")
      {done()}
    }
    function onTimeout(interest, something){
      console.log('fail')
    }
    face.expressInterest(interest, onData, onTimeout)
  })
  it('should send an Interest to fetch the data', function(done){
  this.timeout(10000)
  function check(){
    if (window.gotInterest != true){
      setTimeout(check, 100)
    } else {
      done()
    }
  }
  check()
  })
  it('should respond to Interest with data', function(done){
    this.timeout(10000)
    var n = new ndn.Name("test")
    var inst = new ndn.Interest(n)
    inst.setInterestLifetimeMilliseconds(1000)
    function onData(interest, data){
      if (data.content.toString() == "success"){
        done()
      }
    }
    function onTimeout(interest, something){
      console.log('fail')
    }
    face.expressInterest(inst, onData, onTimeout)
  })
})
*/
