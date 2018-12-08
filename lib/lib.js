const ipfs = require('./ipfs.js')
const api = require('./api.js')

module.exports = (callback) => {
  ipfs((error, node) => {
    if (error) {
      callback(error)
    } else {
      api(node, callback)
    }
  })
}
