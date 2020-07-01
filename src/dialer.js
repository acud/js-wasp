'use strict'
/* eslint-disable no-console */

/*
 * Dialer Node
 */

const multiaddr = require('multiaddr')
const PeerId = require('peer-id')
const Node = require('./libp2p/libp2p-bundle')
const pipe = require('it-pipe')
const protobuf = require("protobufjs");

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

  console.log('nodeA dialed to nodeB on protocol: ',proto)
//var messages = require('./build/syn');

//var message = new messages.Syn();

  //goog.require('proto.handshake.Syn')

//var message = proto.handshake.Syn()

  pipe(
    // Source data
    message,
    //['hey'],
    // Write to the stream, and pass its output to the next function
    stream,
    // Sink function
    async function (source) {
      // For each chunk of data
      for await (const data of source) {
        // Output the data
        console.log('received echo:', data.toString())
      }
    }
  )
}

run()
