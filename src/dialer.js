'use strict'
/* eslint-disable no-console */

const multiaddr = require('multiaddr')
const PeerId = require('peer-id')
const Node = require('./libp2p/libp2p-bundle')
const pipe = require('it-pipe')
const protobuf = require("protobufjs")
const lp = require('it-length-prefixed')
const wallet = require('./wallet')
const PassThrough = require('stream').PassThrough;
var ww = wallet();
const multiaddr = require('multiaddr')

console.log("overlay:")
console.log(ww.getOverlay())
console.log("private key:")
console.log(ww.getPrivateKey())



let genSignData = function (under, over) {
  let networkId = Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 1])
  let u1 = Uint8Array.from(under)
  let o1 = Uint8Array.from(over)
 
  let data = Buffer.concat([u1, o1, networkId])
  let eth =Uint8Array.from(Array.from("\x19Ethereum Signed Message:\n" + data.length))
  let data1 = Buffer.concat([eth,data])
  console.log(data1)
  return data1
}

function passthroughToStream(ps, stream) {
  const asyncIterable = {
    async*[Symbol.asyncIterator]() {
      for await (const chunk of ps) {
        yield chunk;
      }
    }
  };

  pipe(
    // Read from passthrough stream (the source)
    asyncIterable,
    // Encode with length prefix (so receiving side knows how much data is coming)
    lp.encode(),
    // Write to the stream (the sink)
    stream.sink
  )
}

function streamToPs(stream, ps) {
  pipe(
    // Read from the stream (the source)
    stream.source,
    // Decode length-prefixed data
    lp.decode(),
    // Sink function
    async function (source) {
      // For each chunk of data
      for await (const msg of source) {
        // Output the data as a utf8 string
        let v = new Uint8Array(msg.slice());
        ps.write(v)
      }
    }

  )
}



function passthroughToStream(ps, stream) {
  const asyncIterable = {
    async*[Symbol.asyncIterator]() {
      for await (const chunk of ps) {
        yield chunk;
      }
    }
  };

  pipe(
    // Read from passthrough stream (the source)
    asyncIterable,
    // Encode with length prefix (so receiving side knows how much data is coming)
    lp.encode(),
    // Write to the stream (the sink)
    stream.sink
  )
}

function streamToPs(stream, ps) {
  pipe(
    // Read from the stream (the source)
    stream.source,
    // Decode length-prefixed data
    lp.decode(),
    // Sink function
    async function (source) {
      // For each chunk of data
      for await (const msg of source) {
        // Output the data as a utf8 string
        let v = new Uint8Array(msg.slice());
        ps.write(v)
      }
    }

  )
}

async function run() {

  let root = await protobuf.load("pb/handshake.proto")

  // Obtain a message types
  var Syn = root.lookupType("handshake.Syn");
  var Ack = root.lookupType("handshake.Ack");
  var SynAck = root.lookupType("handshake.SynAck");
  var Addr = root.lookupType("handshake.BzzAddress");


  const [dialerId, listenerId] = await Promise.all([
    PeerId.createFromJSON(require('./id-d')),
    PeerId.createFromJSON(require('./id-l'))
  ])

  // Dialer
  const dialerNode = new Node({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/0']
    },
    peerId: dialerId
  })

  // Add peer to Dial (the listener) into the PeerStore
  const listenerMultiaddr = "/ip4/127.0.0.1/tcp/7070/p2p/16Uiu2HAmGZYxnQG2Mhibjxyjfn3TuYE7PeFFxuAoAac9fZoy8viA"//'/ip4/127.0.0.1/tcp/7070/p2p/16Uiu2HAmTjKQVuuZRtrAKWnMf2p1FYAUqmfHh9DdFicyCvZCRffN'

  // Start the dialer libp2p node
  await dialerNode.start()

  console.log('Dialer ready, listening on:')
  dialerNode.multiaddrs.forEach((ma) => console.log(ma.toString() +
    '/p2p/' + dialerId.toB58String()))

  // Dial the listener node
  console.log('Dialing to peer:', listenerMultiaddr)
  const proto = '/swarm/handshake/1.0.0/handshake'
  const { stream } = await dialerNode.dialProtocol(listenerMultiaddr, proto)
  let protoWriter = new PassThrough();
  let protoReader = new PassThrough();

  passthroughToStream(protoWriter, stream);
  streamToPs(stream, protoReader);

  console.log('nodeA dialed to nodeB on protocol: ', proto)

  const addr = multiaddr("/ip4/127.0.0.1/tcp/7070/p2p/16Uiu2HAm8Wg94rkGaq3JLH6UUVgvUAW5DRficCcaqH7rAReB2h6w")
  var message = Syn.create({ ObservedUnderlay: addr.buffer }); // or use .fromObject if conversion is necessary
  var buffer = Syn.encode(message).finish();

  let ttt = Uint8Array.from(buffer)
  protoWriter.write(ttt)
 
  let r;
  let i = 0;
  while (i < 10) {
    r = protoReader.read();
    if (r != null) {
      break;
    }
    i++;
    await sleep(100)
  }

  var message = SynAck.decode(r);
  console.log("************SYNCACK*********")
  console.log(message)
  console.log("************SYNCACK*********")

  let u1 = message.Syn.ObservedUnderlay
  let o1 = ww.getOverlay()
  let signature = ww.signDigest32(genSignData(u1, o1))
  let aa = Addr.create(
    {
      Underlay: u1,
      Overlay: o1,
      Signature: signature,
    }
  );
  var a = Ack.create({
    Address: aa,
    NetworkID: 1,
    Light: false,
    WelcomeMessage: "welcome earthling",
  });
  console.log("************ACK*********")
  console.log(a);
  console.log("************ACK*********")
  let aaa = Ack.encode(a).finish()
  console.log("sending ack")
  protoWriter.write(aaa);

  console.log("sleeping")
  await sleep(1000)
  console.log("done sleeping")
  return
}

let t = run()
t.then()

console.log("returning")


function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}   
