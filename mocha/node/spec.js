var ndn = require('ndn-lib')

var fa = new ndn.Face({host:1, port:1})
var RegisteredPrefix = function(prefix, closure) {this.prefix = new ndn.Name(prefix); this.closure = closure}
var net = require('net')
var tcpServ = require('ndn-tcpServerTransport').transport

function onInterest (prefix,interest,transport){
  global.gotInterest = true
  console.log("got interest", prefix)
  var d = new ndn.Data(new ndn.Name(interest.name.toUri()), new ndn.SignedInfo(), "success")
  d.signedInfo.setFinalBlockID(new ndn.Name.Component([0x00]))
  d.signedInfo.setFields()
  var encoded = d.wireEncode()
  console.log("sending encoded",encoded )
  transport.send(encoded.buffer)
  console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
}
var face = new ndn.Face({host:'localhost', port: 9999})
  var closure = new ndn.Face.CallbackClosure(null, null, onInterest, 'test', face.transport)
  ndn.Face.registeredPrefixTable.push(new RegisteredPrefix('test', closure))
  console.log(face)


describe('ping', function(){
  it('should respond to write request with dummy data', function(done){
    var command = new ndn.Name("test").append(new ndn.Name.Component([0xc1, 0x2e, 0x52, 0x2e, 0x73, 0x77]))
    var interest = new ndn.Interest(command)
    interest.setInterestLifetimeMilliseconds(1000)
    function onData(interest, data){
      if (data.content.toString() == "content stored")
      {done()}
    }
    function onTimeout(interest, something){
      console.log('fail')
    }
    console.log(interest, face)
    face.expressInterest(interest, onData, onTimeout)
    console.log(ndn.Face.registeredPrefixTable)

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
    console.log(ndn.Face.registeredPrefixTable, "PPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPpp")
    face.expressInterest(inst, onData, onTimeout)
  })


})
