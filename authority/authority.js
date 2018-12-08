const request = require('request')
const Room = require('ipfs-pubsub-room')
const IPFS = require('ipfs')
const EventEmitter = require('events')
const KECCAK_JSON = { format: 'dag-cbor', hashAlg: 'keccak-256' }

module.exports = (topic, root, endpoint) => {
    return new Authority(topic, root, endpoint)
}


class Authority extends EventEmitter {

    constructor (topic, root, endpoints) {
        super()
        // Start IPFS node with experimental pubsub on
        this._node = new IPFS({
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
        this._root = root
        this._topic = topic
        this._endpoint = endpoints.endpoint
        this._begin = endpoints.begin
        this._end = endpoints.end
        this._start(root)
        this._lock = false
    }

    _start (root) {
        // When the ipfs node is ready, create/connect to the PS room
        this._node.on('ready', () => {

            this.emit('node ready')

            this._room = Room(this._node, this._topic)

            this._room.on('subscribed', () => {
                this.emit('subscribed')
            })
            
            this._room.on('peer joined', (peer) => {
                this.emit('peer joined', peer)
                this._room.broadcast(this._root)
            })

            this._room.on('error', (err) => {
                this.emit('error', err)
            })

            this._initialize(root, (err, res) => {
                if (err) {
                    this.emit('error', err)
                } else {
                    this._curFile = res.value
                    this.emit('ready')
                    setInterval(this._update.bind(this), 1000)
                }
            })
        })
    }

    _initialize (root, callback) {
        this._node.dag.get(root, function (err, res) {
            callback(err, res)
        })
    }

    _update () {
        if (!this._lock) {
            this._lock = true
            request(this._endpoint, (err, resp, body) => {
                if (err) {
                    this._lock = false
                    this.emit('error', err)
                } else {
                    var blockNum = parseInt(JSON.parse(body).result, 16)
                    if (blockNum > this.lastBlock()) {
                        this._addBlock(blockNum, (block_err, block_cur, block_cid) => {
                            if (block_err) {
                                this._lock = false
                                this.emit('error', block_err)
                            } else {
                                this.emit('block added', block_cur)
                                this._addFile(blockNum, block_cid.toString(), (err, cur, cid) => {
                                    if (err) {
                                        this._lock = false
                                        this.emit('error', err)
                                    } else {
                                        this._lock = false
                                        this._root = cid.toString()
                                        this._curFile = cur
                                        this.emit('file added', cur, cid)
                                    }
                                })
                            }
                        })
                    } else {
                        this._lock = false
                    }
                }
            })
        }
    }

    _addFile (blockNum, block_cid, callback) {
        console.log('Adding file: ' + blockNum)
        var cur = this._curFile
        cur.latest = blockNum
        if (cur.blocks.length == 256) {
            cur.last = this._root
            cur.blocks = [ block_cid ]
        } else {
            console.log(this._root)
            cur.blocks.push(block_cid)
        }
        this._node.dag.put(cur, KECCAK_JSON, function (err, cid) {
            callback(err, cur, cid)
        })
    }

    _addBlock (blockNum, callback) {
        let endpoint = this._begin + this._toHex(blockNum) + this._end
        request(endpoint, (err, resp, body) => {
           if (err) {
               callback(err)
           } else {
               let body_json = JSON.parse(body)
               this._addTx(body_json.result.transactions, (error, tx_cid) => {
                   let object = {
                     jsonrpc: body_json.jsonrpc, 
                     id: body_json.id,
                     difficulty: body_json.result.difficulty, 
                     extraData: body_json.result.extraData,
                     gasLimit: body_json.result.gasLimit,
                     gasUsed: body_json.result.gasUsed,
                     hash: body_json.result.hash,
                     logsBloom: body_json.result.logsBloom,
                     miner: body_json.result.miner,
                     mixHash: body_json.result.mixHash,
                     nonce: body_json.result.nonce,
                     number: body_json.result.number,
                     parentHash: body_json.result.parentHash,
                     receiptsRoot: body_json.result.receiptsRoot,
                     sha3Uncles: body_json.result.sha3Uncles,
                     size: body_json.result.size,
                     stateRoot: body_json.result.stateRoot,
                     timestamp: body_json.result.timestamp,
                     totalDifficulty: body_json.result.totalDifficulty,
                     transactions: tx_cid.toString()
                   }
                   this._node.dag.put(object, KECCAK_JSON, (e, cid) => {
                       callback(e, object, cid)
                   })
               })
           }
        })
    }

    _addTx (tx, callback) {
       this._node.dag.put(tx, KECCAK_JSON, (e, cid) => {
           callback(e, cid)
       })
    }

    _toNibble(val) {
      if (val < 10) {
        return String.fromCharCode(val + 48)
      } else {
        return String.fromCharCode(val + 87)
      }
    }

    _toHex(val) {
      if (val < 16) {
        return this._toNibble(val) 
      } else {
        return this._toHex(val / 16) + this._toNibble(val % 16)
      }
    }

    lastBlock () {
        return this._curFile.latest
    }

    getTopic () {
        return this._topic
    }

    getFiles () {
        return this._curFile
    }
}
