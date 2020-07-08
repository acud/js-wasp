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
+       fmt.Println(string(syn.ObservedUnderlay))
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
const protobuf = require("protobufjs");
const lp = require('it-length-prefixed')

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
  //const listenerMultiaddr = '/ip4/127.0.0.1/tcp/10333/p2p/' + listenerId.toB58String()
  const listenerMultiaddr = '/ip4/127.0.0.1/tcp/7070/p2p/16Uiu2HAm8Wg94rkGaq3JLH6UUVgvUAW5DRficCcaqH7rAReB2h6w' //'/ip4/127.0.0.1/tcp/10333/p2p/' + listenerId.toB58String()

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
  protobuf.load("pb/handshake.proto", function (err, root) {
    if (err)
      throw err;

    // Obtain a message type
    var Syn = root.lookupType("handshake.Syn");
    var Ack = root.lookupType("handshake.Ack");
    var SynAck = root.lookupType("handshake.SynAck");
   
   
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

    // ... do something with buffer

    // Decode an Uint8Array (browser) or Buffer (node) to a message
    //var message = AwesomeMessage.decode(buffer);
    // ... do something with message

    // If the application uses length-delimited buffers, there is also encodeDelimited and decodeDelimited.

    // Maybe convert the message back to a plain object
    //var object = AwesomeMessage.toObject(message, {
    //longs: String,
    //enums: String,
    //bytes: String,
    //// see ConversionOptions
    //});
    console.log(buffer)
    pipe(
      // Source data
      [buffer],
      lp.encode(),
      //['hey'],
      // Write to the stream, and pass its output to the next function
      stream,
      lp.decode(),
      // Sink function
      async function (source) {
      //  await sleep(1000)
        // For each chunk of data
        let b =  Buffer.alloc(10000)
        for await (const data of source) {
          // Output the data
          //b.write(data)
          console.log("1,")

        var message = SynAck.decode(data.slice());

        console.log(message)    
        } 

      }
    )
  });

  //var message = new messages.Syn();

  //goog.require('proto.handshake.Syn')

  //var message = proto.handshake.Syn()

  //pipe(
  //// Source data
  //message,
  ////['hey'],
  //// Write to the stream, and pass its output to the next function
  //stream,
  //// Sink function
  //async function (source) {
  //// For each chunk of data
  //for await (const data of source) {
  //// Output the data
  //console.log('received echo:', data.toString())
  //}
  //}
  //)
}

run()



function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}   