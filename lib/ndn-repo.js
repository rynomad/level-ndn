//Global Namespacing for the ndnr
var level = require('levelup')
  , down
  , subl = require('level-sublevel')
  , encoding = {
    encode : function (val) { return val }
  , decode : function (val) { return val }
  , buffer : true // encode returns a buffer-like and decode accepts a buffer
  , type   : "bin" // name of this encoding type.
}

function indexedDBOk() {
  return "indexedDB" in window;
};
var LOG = 5
var RegisteredPrefix = function RegisteredPrefix(prefix, closure)
{
  this.prefix = prefix;        // String
  this.closure = closure;  // Closure
};

ndn = require("ndn-lib");
var Name = ndn.Name;
var utils = require("ndn-utils")
  var path = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH || "ndn-repo"
  path += "/.level-ndn"
  console.log(path)
ndn.WireFormat.setDefaultWireFormat(ndn.TlvWireFormat.get())



var ndnr = {};

ndnr.levelDown = function (module) {
  down = module;
}

ndnr.initFace = function(stringPrefix,transport, streamOrPort, ack) {

  function nextHop () {
    var d, enc, inst, onData, onInterest, onTimeout, param;

    param = {
      uri: stringPrefix
    };


    console.log("nexthop uri:", param.uri);
    name = new ndn.Name("localhost/nfd/fib/add-nexthop")

    d = new ndn.Data(new ndn.Name(''), new ndn.SignedInfo(), JSON.stringify(param));

    d.signedInfo.setFields();

    d.sign();

    enc = d.wireEncode();

    name.append(enc.buffer);

    inst = new ndn.Interest(name);


    onData = function(interest, data, something) {
      var registeredPrefix;
      if ((data.content.toString() === "success")) {
        console.log('got success response from nfd')
      }
    };

    onTimeout = function(name, interest, something) {
      return console.log('timeout for add nexthop', name, interest, something);
    };

    ndnr.face.expressInterest(inst, onData, onTimeout);
  }
  if (transport == undefined) {
    ndnr.face = new ndn.Face({host:'localhost', port:6464})
    ndnr.face.transport.connect(ndnr.face, function(){console.log('connection to daemon via tcp'); nextHop()})
    console.log(stringPrefix)
  } else {
    ndnr.face = new ndn.Face({host:32, port:31, getTransport: function(){return new transport.transport(streamOrPort)}})
    ndnr.face.transport.connect(ndnr.face, function(){console.log('connecting to daemon from repo'); nextHop()})
    console.log(stringPrefix)
  }
  var prefix = new ndn.Name(stringPrefix)
  console.log(prefix)
  var closure = new ndn.Face.CallbackClosure(null, null, ndnr.interestHandler, prefix, ndnr.face.transport);
  var regPrefix = new RegisteredPrefix(prefix, closure)
  ndn.Face.registeredPrefixTable.push(regPrefix);
  console.log("repo prefix table!!!!!!!!!",ndn.Face.registeredPrefixTable)


  ack()

}

// vvvv THIS IS THE GOOD STUFF vvvv Plus NDN-helpers. NEED to Refactor and streamline useIndexedDB a little but it seems to be working good

ndnr.interestHandler = function(prefix, interest, transport) {
  console.log("onInterest called for incoming interest: ", interest.toUri());
  interest.face = ndnr.face;
  if (utils.nameHasCommandMarker(interest.name)) {
    console.log('incoming interest has command marker ', utils.getCommandMarker(interest.name));
    executeCommand(prefix, interest, transport);
    return;
  } else {
    console.log('attempting to fulfill interest');
    fulfillInterest(prefix, interest, transport);
  };
};


function send(data, transport) {
  if (down != false) {

    transport.send(ndn.EncodingUtils.decodeHexData(data).wireEncode().buffer)
  } else {
    transport.send(data)
  }


}


//TODO: Flesh out this subroutine, it is the keystone of the library, handle interest selectors, etc
function fulfillInterest(prefix, interest, transport) {
  console.log('repo fulfilling interest')
  var objectStoreName = utils.normalizeNameToObjectStore(interest.name),
      dbName = prefix.toUri(),
      getContent = {},
      suffixIndex = 0,
      contentKey = '%00';
      if ((interest.childSelector == 0) || (interest.childSelector == undefined)) {
        var reverse = false;
      } else {
        var reverse = true;
      };

  if (utils.endsWithSegmentNumber(interest.name)) {

    // A specific segment of a data object is being requested, so don't bother querying for loose matches, just return or drop
    var requestedSegment = utils.getSegmentInteger(interest.name)
    var segAr = utils.initSegment(requestedSegment)
    console.log(requestedSegment, interest.name.components)
    try {
      if (down != false){var db = subl(level(path, {db: down}))}else{var db = subl(level(path, {valueEncoding: 'binary'}))}
      if (db.sublevels[objectStoreName]){
        db.sublevel(objectStoreName).get((requestedSegment).toString(), function(er, data) {
          console.log(er, data)
          if (er == undefined) {
            if (interest.publisherPublicKeyDigest != undefined) {
              var d = new ndn.Data()
              console.log("DDDDDDDDDDDDDDDDDDATA!!!!!!!!!!!!!!!", data)
              d.wireDecode(data)
              if (ndn.DataUtils.arraysEqual(d.signedInfo.publisher.publisherPublicKeyDigest, interest.publisherPublicKeyDigest.publisherPublicKeyDigest)) {
                send(data, transport)

              } else {
                console.log('got data not matching publisherPublicKeyDigest interest selector')
              }
            } else {
              send(data, transport)

            }
          }
          db.close()
        });
      }

    } catch (er){
      console.log("io err", er.toString())
    }

  } else {
    // A general interest. Interpret according to selectors and return the first segment of the best matching dataset
    var suffixIndex = 0;
    var hit = false
    function crawl(q, lastfail) {
      var cursor, start, end;
      console.log(q)
      if (down != false){db = subl(level(path ,{db:down}))}else{db = subl(level(path ))}
      console.log(db.sublevels['/test'])
      if (true) {
        console.log("db.sublevels[q] == true")
        cursor = db.sublevel(q)

        if (lastfail && (reverse == true)) {
          var tmp = lastfail[lastfail.length - 1]
          lastfail[lastfail.length - 1] = tmp - 1
          end = lastfail
        } else if (lastfail) {
          var tmp = lastfail[lastfail.length - 1]
          lastfail[lastfail.length - 1] = tmp + 1
          start = lastfail
        }
        var read = false
        console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!", start, end)
        cursor.createReadStream({start: start, end: end, reverse: reverse, limit: 1}).on('data', function(data) {
          read = true
          console.log(data)
          if ((interest.exclude == null) || (!interest.exclude.matches(new ndn.Name.Component(data.key)))) {
            console.log('Suffix is not excluded', data.key);
            if (data.key == "%00") {
              console.log('got to data', data);
              if ((interest.minSuffixComponents == null) || (suffixIndex >= interest.minSuffixComponents )) {
                console.log('more than minimum suffix components', path + data.value);
                db.close(function(){
                  if (down != false){var thisdb = subl(level(path, {db: down})).sublevel(data.value)}else{var thisdb = subl(level(path, {valueEncoding: 'binary'})).sublevel(data.value)}
                  thisdb.get('0', function(err, data){
                    console.log("got to data", data)
                    if (interest.publisherPublicKeyDigest != undefined) {
                      var d = new ndn.Data()
                      d.decode(data)
                      if (ndn.DataUtils.arraysEqual(d.signedInfo.publisher.publisherPublicKeyDigest, interest.publisherPublicKeyDigest.publisherPublicKeyDigest)) {
                        send(data, transport)
                      } else {
                        crawl(q, contentKey)
                      }
                    } else {
                      send(data, transport)
                    }
                  })

                })

              } else {
                console.log('not enough suffix')
                crawl(q, contentKey)
              }
            } else {
              console.log('keep crawling')

              if ((interest.maxSuffixComponents == null) || (suffixIndex  < interest.maxSuffixComponents)) {
                suffixIndex++
                crawl(data.value)
              } else {
                console.log('reached max suffix');
                crawl(q,  data.key)
              }
            }

          } else {
            console.log('name component is excluded in interest,')
            crawl(q, data.key)
          }
        }).on('end', function(err,data){
          console.log("EEEEEEEEEEEEE",err,data)
          if ((read == false) && (((interest.minSuffixComponents == null) && (suffixIndex > 0)) || (suffixIndex > interest.minSuffixComponents ))) {
            //we've exhasted this depth, need to go up a level, and we have the leeway from minSuffix to allow
            var comps = q.split('/')
            var fail = comps.pop()
            var newQ = comps.join('/')
            crawl(newQ, new ndn.Name.Component(fail).value)
          }

        })
      }


    }
    var query = interest.name.toUri()
    try {
      crawl(query)
    } catch(e){
      console.log('crawler er', e.toString())
    }

  }
};


function recursiveSegmentRequest(face, prefix, objectStoreName) {
  var firstSegmentName = new ndn.Name(objectStoreName);
  var contentArray = [];

  function putContentArray () {
    var dbName = prefix.toUri();
    console.log(dbName, objectStoreName, path + objectStoreName)
    var finalSegment = contentArray.length - 1
    if (down != false){var db = subl(level(path, {db: down}))}else{var db = subl(level(path,{valueEncoding: 'binary'}))}

    var ops = []
    for (var i = 0; i < contentArray.length; i++){
      if (down != false) {
        op = {type: 'put', key: i.toString(), value: contentArray[i].wireEncode().toHex()}
      } else {
        op = {type: 'put', key: i.toString(), value: contentArray[i].wireEncode().buffer}
      }
      ops.push(op)
    }

    db.sublevel(objectStoreName).batch(ops, function(err){console.log('segments put in db'); db.close()})


  }


  var interestsInFlight = 0;
  var windowSize = 10;
  var t0 = new Date().getTime()
  var segmentRequested = [];
  var whenNotGottenTriggered = false

  var name = firstSegmentName.getPrefix(-1)






  var recievedSegments = 0;
  var numberOfSegments = null
  var onData = function(interest, co) {
    interestsInFlight--;
    recievedSegments++;
    console.log(co)
    var segmentNumber = utils.getSegmentInteger(co.name)
    if (numberOfSegments == null) {
      numberOfSegments = 1 + ndn.DataUtils.bigEndianToUnsignedInt(co.signedInfo.finalBlockID);
    }
    //console.log(segmentNumber);
    if (contentArray[segmentNumber] == undefined) {
        contentArray[segmentNumber] = co
      }



    //console.log(recievedSegments, finalSegmentNumber, interestsInFlight);
    if (recievedSegments == numberOfSegments) {
        console.log('got all segment', contentArray.length);
        var t1 = new Date().getTime()
        console.log(t1 - t0)
        putContentArray()
    } else {
      if (interestsInFlight < windowSize) {
        for (var i = 0; i < numberOfSegments; i++) {
          if ((contentArray[i] == undefined) && (segmentRequested[i] == undefined)) {
            var newName = co.name.getPrefix(-1).appendSegment(i)
            var newInterest = new ndn.Interest(newName)
            console.log(newName.toUri())
            utils.setNonce(newInterest)
            newInterest.interestLifetime = 4000
            ndnr.face.expressInterest(newInterest, onData, onTimeout)
            segmentRequested[i] = 0;
            interestsInFlight++
            if (interestsInFlight == windowSize) {
              //stop iterating
              i = numberOfSegments;
            }
          }
        }
      }
    }
  }
  var onTimeout = function(interest) {
    var seg = utils.getSegmentInteger(interest.name)
    if (segmentRequested[seg] < 3) {
      segmentRequested[seg]++
      var newInterest = new ndn.Interest(interest.name);
      utils.setNonce(newInterest)
      newInterest.interestLifetime = 4000
      ndnr.face.expressInterest(newInterest, onData, onTimeout)

    } else if ((whenNotGottenTriggered == false)) {
      whenNotGottenTriggered = true;
    }
  }

  var segName = new ndn.Name(name)
  segName.appendSegment(0)
  var interest = new ndn.Interest(segName);
  utils.setNonce(interest)
  interest.interestLifetime = 4000
  //console.log(interest.name.toUri())

  ndnr.face.expressInterest(interest, onData, onTimeout);

}

function buildObjectStoreTree(prefix, objectStoreName, onFinished, arg) {
  var dbName = prefix.toUri(),
      properName = new ndn.Name(objectStoreName),
      uriArray = utils.getAllPrefixes(properName),
      toCreate = [],
      evaluate = {},
      growTree = {},
      contentKey = utils.initSegment(0),
      version;
  var comps = objectStoreName.split('/')

  if (down != false){var db = subl(level(path, {db: down}))}else{var db = subl(level(path))}
  var ops = []
  for (var i = 1; i < comps.length; i++ ) {
    console.log(comps)
    var value = comps.slice(0, i +1 ).join('/')
    var keyComp = comps[i]

    var slevel = '/'  + comps.slice(1,i ).join('/')

    console.log('!!!!!!!!!!!!!!!!!!!!!',path, slevel, keyComp, value)
    ops.push({type:'put', key: keyComp, value: value, prefix: db.sublevel(slevel)})
  }
  db.batch(ops, function(err){
    console.log("made objectStoreTree", db.sublevels['/test']);
    db.close()
    if (arg != undefined) {
      onFinished(arg, prefix, objectStoreName)
    } else {
      onFinished()
    }

  })


};

function executeCommand(prefix, interest, transport) {
  var command = utils.getCommandMarker(interest.name).split('%7E')[0];

  if (command in ndnr.commandMarkers) {
    console.log("executing recognized command ", command);
    ndnr.commandMarkers[command](prefix, interest, transport);
  } else {
    console.log("ignoring unrecognized command ", command);
  };
};


ndnr.commandMarkers = {};


ndnr.commandMarkers["%C1.R.sw"] = function startWrite( prefix, interest, transport) {
  var localName = utils.getNameWithoutCommandMarker(interest.name),
      objectStoreName = utils.normalizeNameToObjectStore(localName);


  console.log("Building objectStore Tree for ", objectStoreName, this);

  buildObjectStoreTree(prefix, objectStoreName, recursiveSegmentRequest, interest.face);

  var data = new ndn.Data(interest.name, new ndn.SignedInfo, "content storage request recieved")
  data.signedInfo.setFields();
  data.sign()
  var enc = data.wireEncode();
  transport.send(enc.buffer)
};

ndnr.commandMarkers["%C1.R.sw"].component = new Name.Component([0xc1, 0x2e, 0x52, 0x2e, 0x73, 0x77]);

module.exports = ndnr

