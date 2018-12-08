const IPFS = require('ipfs')
const node = new IPFS()

node.on('ready', () => {
  let obj = {
    latest: 0 
  }
  node.dag.put(obj, (error, cid) => {
    console.log(cid.toBaseEncodedString())
    node.dag.get(cid.toBaseEncodedString() + '/latest', (error, result) => {
      console.log(error, result.value)
    })
  })
})
