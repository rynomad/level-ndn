var cache = require('./index.js')
var ndn = require('ndn-lib')

var assert = require('assert')

var name = new ndn.Name("something")
var interest = new ndn.Interest(name)
var content = "hello world"
var si = new ndn.SignedInfo()
si.setFreshnessPeriod(10000)
var data = new ndn.Data(name, si, content)
data.signedInfo.setFields()
data.sign()
var encodedData = data.wireEncode()
var element = interest.wireEncode()

var newTimeout = function(func, sec) {
  return new setTimeout(func, sec)
}

var initialCheck = false
var dataInserted = false
var cacheHit = false
describe('cache',function(){
  it('should trigger cache miss callback', function(){
    cache.check(interest,element, null, function(){
      assert.equal(false, true)
    }, function(){
      initialCheck = true
    })
    
  })
  it('should accept data', function(){
    (function checkInit (){
      if (initialCheck == true){
        cache.data(data, encodedData)
        dataInserted = true
      } else {
        setTimeout(checkInit, 100)
      }
    })()
  })
  it('should trigger cache hit', function(){
    (function checkInit (){
      if (dataInserted == true){
        cache.check(interest, element, null, function(a, b){
          assert.equal(a.name.toUri(), interest.name.toUri() )
          cacheHit = true
        },function(){

        });
        
      } else {
        setTimeout(checkInit, 100)
      }
    })()
  })
  it('should trigger cache miss after timeout',function(){
    (function checkInit(){
      if (cacheHit == true){
        var time1 = Date.now()
        cache.check(interest, element, null, function(a, b){
          console.log(a,b)
          setTimeout(checkInit, 500)
        }, function(a,b){
          var diff = Date.now() - time1
          var passed = false
          if (diff > 6000 ) {
            passed = true
          }
          assert.equal(true, passed)
        })
      } else {
        setTimeout(checkInit, 500)
      }
    })()
  })
})
