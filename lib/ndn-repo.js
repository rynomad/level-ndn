//Global Namespacing for the ndnr
var level = require('levelup');
  , down;

function indexedDBOk() {
  return "indexedDB" in window;
};

var RegisteredPrefix = function RegisteredPrefix(prefix, closure)
{
  this.prefix = prefix;        // String
  this.closure = closure;  // Closure
};

var ndn = require("ndn-lib");
var Name = ndn.Name;
var utils = require("ndn-utils")

/**
 * Database constructor
 * @prefix: application prefix (used as database name) STRING (may contain globally routable prefix)
 */

var ndnr = {};

ndnr.levelDown = function (module) {
  down = module;
}

ndnr.initFace = function(transport, streamOrPort) {
 
  ndnr.face = new ndn.Face({host:32, port:31, getTransport: function(){return new transport.transport(streamOrPort)}})
  ndnr.face.transport.connect(self.face, function(){console.log('connecting to daemon from repo')})

  var prefix = new ndn.Name("")
  var closure = new ndn.Face.CallbackClosure(null, null, ndnr.interestHandler, prefix, ndnr.face.transport);
  ndn.Face.registeredPrefixTable.push(new RegisteredPrefix(prefix, closure));
}

// vvvv THIS IS THE GOOD STUFF vvvv Plus NDN-helpers. NEED to Refactor and streamline useIndexedDB a little but it seems to be working good

ndnr.interestHandler = function(prefix, interest, transport) {
  //console.log("onInterest called for incoming interest: ", interest.toUri());
  interest.face = ndnr.face;
  if (utils.nameHasCommandMarker(interest.name)) {
    console.log('incoming interest has command marker ', utils.getCommandMarker(interest.name));
    executeCommand(prefix, interest, transport);
    return;
  } else {
    //console.log('attempting to fulfill interest');
    fulfillInterest(prefix, interest, transport);
  };
};


//TODO: Flesh out this subroutine, it is the keystone of the library, handle interest selectors, etc
function fulfillInterest(prefix, interest, transport) {
  //console.log('repo fulfilling interest')
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
    //console.log(requestedSegment, interest.name.components)
    if (down != false){var db = level(objectStoreName, {db: down})}else{var db = level(objectStoreName)}
    db.get(requestedSegment, function(er, data) {
      if (er == undefined) {
        if (interest.publisherPublicKeyDigest != undefined) {
          var d = new ndn.Data()
          d.decode(data)
          if (ndn.DataUtils.arraysEqual(d.signedInfo.publisher.publisherPublicKeyDigest, interest.publisherPublicKeyDigest.publisherPublicKeyDigest)) {
            transport.send(data)
          } else {
            console.log('got data not matching publisherPublicKeyDigest interest selector')
          }
        } else {
          transport.send(data)
        }
      }
    });
  } else {
    // A general interest. Interpret according to selectors and return the first segment of the best matching dataset
    var suffixIndex = 0;
    var hit = false
    function crawl(q, lastfail) {
      var cursor, start, end;
      console.log(q)
      if (down != false){cursor = level(q,{db:down, createIfMissing: false})}else{cursor = level(q,{createIfMissing: false})}
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
      cursor.createReadStream({start: start, end: end, reverse: reverse, limit: 1}).on('data', function(data) {
        read = true
        if ((interest.exclude == null) || (!interest.exclude.matches(new ndn.Name.Component(data.key)))) {
          console.log('Suffix is not excluded', data.key);
          if (data.key == "%00") {
            console.log('got to data');
            if ((interest.minSuffixComponents == null) || (suffixIndex >= interest.minSuffixComponents )) {
              console.log('more than minimum suffix components');
              if (down != false){var thisdb = level(objectStoreName, {db: down})}else{var thisdb = level(objectStoreName)}
              thisdb.get('0', function(err, data){
                if (interest.publisherPublicKeyDigest != undefined) {
                  var d = new ndn.Data()
                  d.decode(data)
                  if (ndn.DataUtils.arraysEqual(d.signedInfo.publisher.publisherPublicKeyDigest, interest.publisherPublicKeyDigest.publisherPublicKeyDigest)) {
                    transport.send(data)
                  } else {
                    crawl(q, contentKey)
                  }
                } else {
                  transport.send(data)
                }
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
        if ((read == false) && (((interest.minSuffixComponents == null) && (suffixIndex > 0)) || (suffixIndex > interest.minSuffixComponents ))) {
          //we've exhasted this depth, need to go up a level, and we have the leeway from minSuffix to allow
          var comps = q.split('/')
          var fail = comps.pop()
          var newQ = comps.join('/')
          crawl(newQ, new ndn.Name.Component(fail).value)
        }

      })
    }
  var query = interest.name.toUri()
  crawl(query)
  }
};


function recursiveSegmentRequest(face, prefix, objectStoreName) {
  var firstSegmentName = new ndn.Name(objectStoreName);
  var contentArray = [];

  function putContentArray () {
    var dbName = prefix.toUri();
    var collector = new MessageChannel()
    var finalSegment = contentArray.length - 1
    if (down != false){var db = level(objectStoreName, {db: down})}else{var db = level(objectStoreName)}
    function putSegment(seg) {
      var encoded = contentArray[seg].encode()
      var arSeg = utils.initSegment(seg)
      db.put(seg, encoded)
      console.log('put seg ', seg)
      contentArray.pop()

      if (contentArray.length > 0) {
        currentSegment = contentArray.length - 1
        putSegment(currentSegment)
      } else {
        var t1 = new Date().getTime()
        console.log(t1 - t0)

      }
    }
    putSegment(finalSegment)

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
      ndnr.postMessage({responseTo: "fetch", success: false, uri: name.toUri()})
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
  for (var i = comps.length - 1; i > 0; i-- ) {
    console.log(comps)
    var value = comps.join('/')
    var keyComp = comps.pop()

    var slevel = comps.join('/') || '/'
    if (down != false){var db = level(objectStoreName, {db: down})}else{var db = level(objectStoreName)}
    db.put(keyComp, value)

  }
  if (arg != undefined) {
    onFinished(arg, prefix, objectStoreName)
  } else {
    onFinished()
  }

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


ndnr.commandMarkers["%C1.R.sw"] = function startWrite( prefix, interest) {
  var localName = utils.getNameWithoutCommandMarker(interest.name),
      objectStoreName = utils.normalizeNameToObjectStore(localName);


  console.log("Building objectStore Tree for ", objectStoreName, this);

  buildObjectStoreTree(prefix, objectStoreName, recursiveSegmentRequest, interest.face);
};

ndnr.commandMarkers["%C1.R.sw"].component = new Name.Component([0xc1, 0x2e, 0x52, 0x2e, 0x73, 0x77]);

module.exports = ndnr

