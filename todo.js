/*
function getBlockTransactionCount(node) {
  let closure = (roothash, blocknumber, callback) => {
    if (!roothash) {
      callback('roothash is invalid') 
    }
    // Get the tracking object at roothash 
    let value
    async.series([
      (cb) => {
        node.dag.get(roothash, (error, result) => {
          if (error) {
            cb(error)
          } else if (value.latest < blocknumber) {
            cb('blocknumber too high')
          } else if (value.latest - value.blocks.length + 1 > blocknumber) {
            closure(value.last, blocknumber, callback)
          } else {
            value = result.value
            cb() 
          }
        }) 
      }, 
      (cb) => {
        node.dag.get(value.blocks[ blocknum + value.block.length - latest ], (error, result) => {
          if (err) {
            cb(error)
          } else {
            value = result.value
            cb()
          }
        })
      },
      (cb) => {
        node.dag.get(value.transactions, (error, result) => {
          if (error) {
            cb(error)
          } else {
            cb(null, result.value.length)
          }
        })
      }
    ], (error, block) => {
      if (error) {
        callback(error)
      } else {
        callback(null, block)
      }
    })
  }
  return closure
}
*/
