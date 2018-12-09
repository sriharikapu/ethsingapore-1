const requests = require('request')
const util = require('util')
const request = util.promisify(requests)
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
            }
        })
        // console.log(this._node)
        // this._node.bootstrap.add('/ip4/203.118.42.165/tcp/64417/ipfs/QmaVygMJHKhh1BPZvorkLSZsLQ7vmRpYhCjJ5dakavt2Yo')
        this._root = root
        this._topic = topic
        this._endpoint = endpoints.endpoint
        this._begin = endpoints.begin
        this._end = endpoints.end
    }

    async start() {
        // console.log('start')
        this._node.on('ready', async () => {
            // console.log(await this._node.bootstrap.list())
            this.emit('node ready')

            this._room = Room(this._node, this._topic)

            this._room.on('subscribed', () => {
                console.log('subbed')
                this.emit('subscribed')
            })
            
            this._room.on('peer joined', (peer) => {
                this.emit('peer joined', peer)
                console.log('peer joined' + peer)
                this._room.broadcast(this._root)
            })

            this._room.on('error', (err) => {
                this.emit('error', err)
            })

            var res = await this._initialize(this._root)
            if (!res.err) {
                // console.log('interval')
                setInterval(this._update.bind(this), 1000)
            }
        })
    }

    async _initialize (root) {
        // console.log('initialize')
        var res = await this._node.dag.get(root)
        if (res.err) {
            this.emit('error', res.err)
        } else {
            this._curFile = res.value
            this.emit('ready')
        }
        return res
    }

    async _update () {
        if (this._isUpdating) {
            return
        }
        this._isUpdating = true
        // console.log('updating')
        
        var blockNum = await request(this._endpoint)
        if (blockNum.err) {
            this.emit('error', blockNum.err)
            this._isUpdating = false
            return
        }

        blockNum = parseInt(JSON.parse(blockNum.body).result, 16)
        if (blockNum <= this.lastBlock()) {
            this._isUpdating = false
            return
        }

        var blockCid = await this._addBlock(blockNum)
        if (blockCid.err) {
            this.emit('error', blockCid.err)
            this._isUpdating = false
            return
        }
        blockCid = blockCid.toString()
        
        var fileCid = await this._addFile(blockNum, blockCid)
        if (fileCid.err) {
            this.emit('error', fileCid.err)
            this._isUpdating = false
            return
        }
        this._isUpdating = false
    }

    async _addBlock (blockNum) {
        console.log('Adding block')
        let endpoint = this._begin + this._toHex(blockNum) + this._end
        var response = await request(endpoint)
        if (response.err) {
            return response
        }
        
        var body = JSON.parse(response.body)
        var txCid = await this._node.dag.put(body.result.transactions, KECCAK_JSON)
        if (!txCid.err) {
            this.emit('block added', body)
        }
      
        let obj = {
            jsonrpc: body.jsonrpc, 
            id: body.id,
            difficulty: body.result.difficulty, 
            extraData: body.result.extraData,
            gasLimit: body.result.gasLimit,
            gasUsed: body.result.gasUsed,
            hash: body.result.hash,
            logsBloom: body.result.logsBloom,
            miner: body.result.miner,
            mixHash: body.result.mixHash,
            nonce: body.result.nonce,
            number: body.result.number,
            parentHash: body.result.parentHash,
            receiptsRoot: body.result.receiptsRoot,
            sha3Uncles: body.result.sha3Uncles,
            size: body.result.size,
            stateRoot: body.result.stateRoot,
            timestamp: body.result.timestamp,
            totalDifficulty: body.result.totalDifficulty,
            transactions: txCid.toString()
        }
        var blockCid = await this._node.dag.put(obj, KECCAK_JSON)
        if (blockCid.err) {
            this.emit('error', blockCid.err) 
        }

        return blockCid
    }

    async _addFile (blockNum, blockCid) {
        console.log('Adding file: ' + blockNum)
        var cur = this._curFile
        cur.latest = blockNum
        if (cur.blocks.length == 256) {
            cur.last = this._root
            cur.blocks = [blockCid]
        } else {
            cur.blocks.push(blockCid)
        }

        var fileCid = await this._node.dag.put(cur, KECCAK_JSON)
        if (!fileCid.err) {
            this._curFile = cur
            this._root = fileCid.toString()
            this._room.broadcast(JSON.stringify(cur))
            this.emit('file added', cur, fileCid)
        }

        return fileCid
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
