const Room = require('ipfs-pubsub-room')
const IPFS = require('ipfs')
const EventEmitter = require('events')

module.exports = (topic, root, endpoint) => {
    return new Authority(topic, root, endpoint)
}

class Authority extends EventEmitter {

    constructor (topic, root, endpoint) {
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
        // Initialize file system from root
        if (!root) {
            var file = toJSON
        }
    }

    _start () {
        // When the ipfs node is ready, create/connect to the PS room
        this._node.on('ready', () => {
            this._room = Room(this._node, this._topic)

            this._room.on('subscribed', () => {
                this.emit('ready')
            })
            
            this._room.on('peer joined', (peer) => {
                this.emit('peer joined', peer)
                this._room.broadcast(this._root)
            })

            this._room.on('error', (err) => {
                this.emit('error', err)
            })

            // Every second, ping API for updated block
            setInterval(this._update.bind(this), 1000)
        })
    }

    _update () {
        var blockNum = request(this._endpoint, function (err, resp, body) {
            console.log('req made')
            console.log(err)
            console.log(resp)
            console.log(body)
            return body.result
        })
        if (blockNum > this._lastBlockNum) {
            
            // this.emit('file added', )
        }
    }
}