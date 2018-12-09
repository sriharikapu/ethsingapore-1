const async = require('async')
const options = { discover: true }
const IPFS = require('ipfs')
const Room = require('ipfs-pubsub-room')
let authority, root, topic = 'ethsg'

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

    room.on('message', (message) => {
      root = message
    })
  })
  let api = { 
    changeRoot: (hash) => {
      root = hash
    }, 
    changeAuthority: (newAuthority) => {
      authority = newAuthority 
    },
    changeTopic: changeTopic(node), 
    getBlockNumber: getBlockNumber(node), 
    getBlockByNumber: getBlockByNumber(node), 
    getRootHash: () => { 
      return root
    }
  }
  callback(null, api)
}

/**
 * This is a message handler for pubsub. Whenever a message is
 * recieved, the messages data will
 */
function handler(msg) { 
  if (authority === msg.from) {
    root = msg.data
  }
}

/**
 * Changes the nodes pubsub topic 
 * @param newTopic - The new pubsub topic
 * @param cbk - A callback function that takes an error as its argument
 */
function changeTopic(node) {
  return (newTopic, callback) => {
    async.series([
      (cb) => {
        if (topic) {
          node.pubsub.unsubscribe(topic, handler, cb)
        } else {
          cb()
        }
      }, 
      (cb) => {
        node.pubsub.subscribe(newTopic, handler, options, cb) 
      }
    ], (error) => {
      if (error) {
        callback(error)
      } else {
        topic = newTopic
        callback()
      }
    })
  }
}

/**
 * Gets the current blocknumber from the filesystem stored at the roothash
 * @param roothash - The roothash of the filesystem to query
 * @param cbk - A callback function that takes an error and the blocknumber as arguments
 */
function getBlockNumber(node) {
  return (roothash, callback) => { 
    node.dag.get(roothash, (error, result) => {
      callback(error, result.value.latest)
    })
  }
}

function getBlockByNumber(node) {
  let closure = (roothash, blocknumber, tx, callback) => {
    if (!roothash) {
      callback('roothash is invalid') 
    }
    // Get the tracking object at roothash 
    let tracker, block
    async.series([
      (cb) => {
        node.dag.get(roothash, (error, result) => {
          tracker = result.value
          if (error) {
            cb(error)
          } else if (tracker.latest < blocknumber) {
            cb('blocknumber too high')
          } else if (tracker.latest - tracker.blocks.length + 1 > blocknumber) {
            closure(tracker.last, blocknumber, callback)
          } else {
            cb() 
          }
        }) 
      }, 
      (cb) => {
        node.dag.get(tracker.blocks[ blocknumber - parseInt(tracker.latest) + tracker.blocks.length - 1 ], (error, result) => {
          if (error) {
            cb(error)
          } else {
            block = result.value
            cb()
          }
        })
      },
      (cb) => {
        node.dag.get(block.transactions, (error, result) => {
          if (error) {
            cb(error)
          } else {
            if (tx === 'only') {
              cb(null, result.value)
            } else if (tx === 'leave') {
              cb(null, block)
            } else {
              block.transactions = result.value
              cb(null, block)
            }
          }
        })
      }
    ], (error, result) => {
      if (error) {
        callback(error)
      } else {
        callback(null, result)
      }
    })
  }
  return closure
}
