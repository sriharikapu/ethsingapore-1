const program = require('commander')
program
    .version('0.1.0')
    .option('-t, --topic [topic]', 'Specify Pubsub room topic', /^(?!\s*$).+/) // Regex matches any nonempty string
    .option('-r, --root [root]', 'Specify filesystem root hash', /^0x[a-fA-F0-9]{64}$/) // Matches 32-byte hex w/ leading 0x
    .parse(process.argv)
    
const BLOCKNUM_ENDPOINT = "https://api.etherscan.io/api?module=proxy&action=eth_blockNumber&apikey=EEQ2VBSYD5D4UQM7GH5DBD1YQTNPWUD8R5"
const BLOCK_ENDPOINT_BEGIN = "https://api.etherscan.io/api?module=proxy&action=eth_getBlockByNumber&tag=" 
const BLOCK_ENDPOINT_END = "&boolean=true&apikey=EEQ2VBSYD5D4UQM7GH5DBD1YQTNPWUD8R5" 
const DEFAULT_ROOT = "zdq6yJpRc1YzdMXgaa1irZaRThvqNd9vThiVqWqDBRuCMakPD"
const DEFAULT_TOPIC = "ethsg"
const INITIAL_ROOT = program.root ? program.root : DEFAULT_ROOT
const INITIAL_TOPIC = program.topic ? program.topic : DEFAULT_TOPIC

// Start IPFS node
const Authority = require('./authority.js')
const authority = Authority(INITIAL_TOPIC, INITIAL_ROOT, { begin: BLOCK_ENDPOINT_BEGIN, end: BLOCK_ENDPOINT_END, endpoint: BLOCKNUM_ENDPOINT })

authority.on('node ready', () => {
    
    authority.on('subscribed', () => {
        console.log('Pubsub online. Using topic: ' + authority.getTopic())
    })

    authority.on('ready', () => {
        console.log('File system online: ' + JSON.stringify(authority.getFiles()))
    })
    
    authority.on('error', (err) => {
        console.log(err)
    })

    authority.on('file added', (file, newRoot) => {
        console.log('Added file: ' + JSON.stringify(file))
        console.log('New root: ' + newRoot)
    })

    authority.on('block added', (file) => {
        console.log('Added file: ' + JSON.stringify(file))
    })

    authority.on('peer joined', (peer) => {
        console.log('Peer joined: ' + peer)
    })
})
