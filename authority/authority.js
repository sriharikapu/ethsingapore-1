const request = require('request')
const Room = require('ipfs-pubsub-room')
const IPFS = require('ipfs')
const EventEmitter = require('events')
const KECCAK_JSON = { format: 'dag-cbor', hashAlg: 'keccak-256' }

module.exports = (topic, root, endpoint) => {
    return new Authority(topic, root, endpoint)
}

class Authority extends EventEmitter {

    constructor (topic, root, endpoint) {
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
        this._topic = topic
        this._endpoint = endpoint
        this._start(root)
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
                    console.log(res.value)
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
        var blockNum = request(this._endpoint, function (err, resp, body) {
            console.log('req made')
            console.log(err)
            console.log(resp)
            console.log(body)
            return parseInt(body.result, 16) // Return blocknum as integer
        })
        // Add file
        if (blockNum > this.lastBlock()) {
            this._update(blockNum)
        }
    }

    _addFile (blockNum) {
        var cur = this._curFile
        cur.latest = blockNum
        if (cur.blocks.length == 256) {
            cur.last = this._root
        } else {
            cur.blocks.push(this._root)
        }
        this._node.dag.put(cur, KECCAK_JSON, function (err, cid) {
            if (err) {
                this.emit('error', err)
            } else {
                this._root = cid
                this._curFile = cur
                this.emit('file added', cur, cid)
            }
        })
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