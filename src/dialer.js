'use strict'
/* eslint-disable no-console */

/*
 * Dialer Node
 */

/*
requires this change in bee for the time being:
growlie@growlie-strikes-back ~/go/src/github.com/ethersphere/bee ±master⚡ » gd                                                                                                                   [1/07/20|12:44PM]
diff --git a/pkg/p2p/libp2p/internal/handshake/handshake.go b/pkg/p2p/libp2p/internal/handshake/handshake.go
index 91fe221..f718e00 100644
--- a/pkg/p2p/libp2p/internal/handshake/handshake.go
+++ b/pkg/p2p/libp2p/internal/handshake/handshake.go
@@ -195,8 +195,8 @@ func (s *Service) Handle(stream p2p.Stream, remoteMultiaddr ma.Multiaddr, remote
       if err := r.ReadMsgWithTimeout(messageTimeout, &syn); err != nil {
               return nil, fmt.Errorf("read syn message: %w", err)
       }
-
-       observedUnderlay, err := ma.NewMultiaddrBytes(syn.ObservedUnderlay)
+       observedUnderlay, err := ma.NewMultiaddr(string(syn.ObservedUnderlay))
       if err != nil {
               return nil, ErrInvalidSyn
       }
growlie@growlie-strikes-back ~/go/src/github.com/et
*/

const multiaddr = require('multiaddr')
const PeerId = require('peer-id')
const Node = require('./libp2p/libp2p-bundle')
const pipe = require('it-pipe')
const protobuf = require("protobufjs")
const lp = require('it-length-prefixed')
const wallet = require('./wallet')
const PassThrough = require('stream').PassThrough;
var ww = wallet();

console.log("overlay:")
console.log(ww.getOverlay())
console.log("private key:")
///ip4/127.0.0.1/tcp/44001/p2p/Qma3GsJmB47xYuyahPZPSadh1avvxfyYQwk8R3UnFrQ6aP
console.log(ww.getPrivateKey())



let genSignData = function (under, over) {
  //func generateSignData(underlay, overlay []byte, networkID uint64) []byte {
  //networkIDBytes := make([]byte, 8)
  //binary.BigEndian.PutUint64(networkIDBytes, networkID)
  //signData := append(underlay, overlay...)
  //return append(signData, networkIDBytes...)
  //}
  let networkId = Uint8Array.from([0, 0, 0, 0, 0, 0, 0, 1])
  let u1 = Uint8Array.from(under)
  let o1 = Uint8Array.from(over)
  let data = Buffer.concat([u1, o1, networkId])// [].push(...u1) //[].concat(u1,o1,networkId)
  console.log(data)
  return data
}



function passthroughToStream(ps, stream) {
  const myAsyncIterable = {
    async*[Symbol.asyncIterator]() {
      for await (const chunk of ps) {
        //console.log(chunk)
        yield chunk;
      }
    }
  };

  pipe(
    // Read from passthrough stream (the source)
    myAsyncIterable,

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
        let vvv = new Uint8Array(msg.slice());
        ps.write(vvv)
        //console.log('> wtffff ' + msg.toString('utf8').replace('\n', ''))
      }
    }

  )
}

async function run() {
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
  const listenerMultiaddr = '/ip4/127.0.0.1/tcp/7070/p2p/16Uiu2HAmTjKQVuuZRtrAKWnMf2p1FYAUqmfHh9DdFicyCvZCRffN'

  // Start the dialer libp2p node
  await dialerNode.start()

  console.log('Dialer ready, listening on:')
  dialerNode.multiaddrs.forEach((ma) => console.log(ma.toString() +
    '/p2p/' + dialerId.toB58String()))

  // Dial the listener node
  console.log('Dialing to peer:', listenerMultiaddr)
  const proto = '/swarm/handshake/1.0.0/handshake'
  const { stream } = await dialerNode.dialProtocol(listenerMultiaddr, proto)

  console.log('nodeA dialed to nodeB on protocol: ', proto)

  let root = await protobuf.load("pb/handshake.proto")

  // Obtain a message type
  var Syn = root.lookupType("handshake.Syn");
  var Ack = root.lookupType("handshake.Ack");
  var SynAck = root.lookupType("handshake.SynAck");
  var Addr = root.lookupType("handshake.BzzAddress");


  // Exemplary payload
  var payload = { ObservedUnderlay: Buffer.from("/ip4/127.0.0.1/tcp/7070/p2p/16Uiu2HAm8Wg94rkGaq3JLH6UUVgvUAW5DRficCcaqH7rAReB2h6w", 'utf-8') };

  // Verify the payload if necessary (i.e. when possibly incomplete or invalid)
  var errMsg = Syn.verify(payload);
  if (errMsg)
    throw Error(errMsg);
  // Create a new message
  var message = Syn.create(payload); // or use .fromObject if conversion is necessary

  // Encode a message to an Uint8Array (browser) or Buffer (node)
  var buffer = Syn.encode(message).finish();


  let protoWriter = new PassThrough();
  let protoReader = new PassThrough();

  passthroughToStream(protoWriter, stream);
  streamToPs(stream, protoReader);
  //console.log(Object.getOw cnPropertyNames(stream.sink.prototype))

  protoWriter.write(buffer)
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
  /*
  try {
    let val = await pipe(
      [buffer],
      lp.encode(),
      stream,
      lp.decode(),
      async function (source) {
        // For each chunk of data
        let b = Buffer.alloc(10000)
        for await (const data of source) {
          var message = SynAck.decode(data.slice());
          console.log("************SYNCACK*********")
          console.log(message)
          console.log("************SYNCACK*********")
          console.log(stream)
          let u1 = message.Syn.ObservedUnderlay
          let o1 = ww.getAddress('ha')
          let signature = ww.signDigest32(genSignData(u1, o1))
          let aa = Addr.create(
            {
              Underlay: u1,
              Overlay: o1,
              Signature: signature.signature,
            }
          );
          var a = Ack.create({ Address: aa });
          console.log("************ACK*********")
          console.log(a);
          console.log("************ACK*********")
          let aaa = Ack.encode(a).finish()
          console.log("sending ack")
          stream.sink(aaa)
          return aaa
        }
      },
 
    )
    console.log("got", val)
    await pipe(
      [val],
      lp.encode(),
      stream,
    )
    console.log('wwwww')
  }
  catch (e) {
    console.log(e)
  }
  */
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
