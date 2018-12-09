/*
const IPFS = require('ipfs')
const Room = require('ipfs-pubsub-room')

module.exports = (callback) => {
  const node = new IPFS()
  node.on('ready', () => {
    callback(null, node)
  })
  node.on('error', () => {
    callback(error)
  })

  const ipfs = new IPFS({
    EXPERIMENTAL: {
      pubsub: true
    },
    config: {
      Addresses: {
        Swarm: [
          '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
        ]
      }
    }
  })

  // IPFS node is ready, so we can start using ipfs-pubsub-room
  ipfs.on('ready', () => {
    const room = Room(ipfs, 'ethsg')

    room.on('peer joined', (peer) => {
      console.log('Peer joined the room', peer)
    })

    room.on('peer left', (peer) => {
      console.log('Peer left...', peer)
    })

    // now started to listen to room
    room.on('subscribed', () => {
      console.log('Now connected!')
    })
  })
}
*/

const IPFS = require('ipfs')
module.exports = (callback) => {
  const node = new IPFS()
  node.on('ready', () => {
    callback(null, node)
  })
  node.on('error', () => {
    callback(error)
  })
}
