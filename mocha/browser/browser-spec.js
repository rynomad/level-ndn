
describe('interface', function(){
  describe('should tangle', function(){
    
    it('with messageChannel', function(done){
      this.timeout(10000)
      var ms = new MessageChannel()
      function cb (){ done()}
      repo.tangle( ms.port1, cb)
    })
  })
})


