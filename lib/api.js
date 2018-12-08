const async = require('async')
const options = { discover: true }
let root, topic

function handler(msg) { 
  root = msg.data
}

module.exports = (node, callback) => {
  let api = { 
    changeTopic: changeTopic, 
    getBlockNumber: getBlockNumber, 
    getRootHash: () => { 
      return root
    }
  }
  callback(null, api)
}

/**
 * Changes the nodes pubsub topic 
 * @param newTopic - The new pubsub topic
 * @param cbk - A callback function that takes an error as its argument
 */
function changeTopic(newTopic, callback) {
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
  ], callback)
}

/**
 * Gets the current blocknumber from the filesystem stored at the roothash
 * @param roothash - The roothash of the filesystem to query
 * @param cbk - A callback function that takes an error and the blocknumber as arguments
 */
function getBlockNumber(roothash, callback) { 
  node.dag.get(hash + '/latest', (error, blocknum) => {
    callback(error, blocknum)
  })
}
