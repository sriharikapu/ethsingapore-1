const ipfs = require('./ipfs.js')
module.exports = (callback) => {
  ipfs((error, node) => {
    if (error) {
      callback(error)
    } else {
      let api = { 
        getBlockNumber: (roothash, callback) => { callback() }, 
        getRootHash: (room, callback) => { callback() } 
      }
      callback(null, api)
    }
  })
}
