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
