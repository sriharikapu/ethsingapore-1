const async = require('async')
const options = { discover: true }
let authority, root, topic

module.exports = (node, callback) => {
  let api = { 
    changeAuthority: (newAuthority) => {
      authority = newAuthority 
    },
    changeTopic: changeTopic(node), 
    getBlockNumber: getBlockNumber(node), 
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
