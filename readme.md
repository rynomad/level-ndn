Level-ndn
=========

Level-ndn is a database designed to store and serve data over [Named Data Networks](http://named-data.net), in the browser (via browserify), Node.js, and in atom-shell. This repo interfaces with the [ndn-forwarder](http://github.com/rynomad/nfd-js) npm module. All of this is made possible by use of the [NDN-js](http://github.com/named-data/ndn-js) library from UCLA.

Warning: Here be Dragons
------------------------

This is early alpha code and while suitable for prototyping and experimenting with NDN apps in javascript, it is not yet ready for primetime. There is a lot of work that needs to be done to optimize data-lookup and storing of binary data, and the exact API will be changing frequently. Pull requests are welcome, especially from those with experience in the level-up ecosystem, node/browser cross compatibiliy, and graceful degredation.



API
===
API SUBJECT TO CHANGE

This module should be initialized after the javascript ndn forwarder is already running, preferably within the callback function. For more on the forwarder initialization and callback, see [javascript ndn-forwarder](http://github.com/rynomad/nfd-js)

The module provides a 'tangle' method that attaches it to a running forwarder along a given prefix, and an 'init' method to spin up the actual data-store.

```
var forwarder = require("ndn-forwarder")
  , repo = require("level-ndn")

forwarder(function(self){
  var namespace = "your/application/namespace"
  function callback(){
    repo.init(namespace, cb, firstcb)
    //cb = a callback executed every time the repo is initialized
    //firstcb = a callback executed the first time the repo is initialized on a machine, useful for importing/migrating data.
  }
  repo.tangle(namespace, null, null, callback)
  //the 'null' arguments here are for future versions where we allow for various transports to connect with the nfd

})

```

Once initialized, the repo reponds to interest messages and storage requests (using command markers, subject to change to avoid collision with C++ ndn repo). To avoid having to deal with NDN data at the packet level, use [ndn-io](http://github.com/rynomad/ndn-io) to store and retrieve data.
