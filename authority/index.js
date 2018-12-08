const readline = require('readline')
const async = require('async')
const request = require('request')
const Authority = require('./authority.js')

// Etherscan blocknumber endpoint
const BLOCKNUM_ENDPOINT = "https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=EEQ2VBSYD5D4UQM7GH5DBD1YQTNPWUD8R5"

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const program = require('commander')
program
    .version('0.1.0')
    .option('-t, --topic [topic]', 'Specify Pubsub room topic', /^(?!\s*$).+/) // Regex matches any nonempty string
    .option('-r, --root [root]', 'Specify filesystem root hash', /^0x[a-fA-F0-9]{64}$/) // Matches 32-byte hex w/ leading 0x
    .parse(process.argv)

async.series([
    (next) => {
        // Set server name
        if (program.name) {
            server.name = program.name
        } else {
            rl.question('Enter Pubsub room name:', (name) => {
                server.name = name
            })
        }
        next()
    },
    (next) => {
        // Set server root hash
        if (program.root) {
            server.root = program.root
        } else {
            rl.question('Enter root file hash:', (root) => {
                server.root = root
            })
        }
        next()
    }
], () => {
    rl.close()
    // Start IPFS node
    const authority = Authority(server.name, server.root, BLOCKNUM_ENDPOINT)

    authority.on('ready', () => {
        
        authority.on('error', (err) => {
            console.log(err)
        })

        authority.on('file added', (file) => {
            console.log('Added file: ' + file)
        })

        authority.on('peer joined', (peer) => {
            console.log('Peer joined: ' + peer)
        })
    })
})
