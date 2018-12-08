var express = require('express');
var http = require('http');
const Store = require('data-store');

const store = new Store({ path: 'config.json' });
store.set("hash", process.argv[2])
store.set("room", process.argv[3])

var app = express();
var server = http.createServer(app);

app.get('/', function(req, res) {
  res.send("Hello World!");
});

app.get('/getBlockNumber', function(req, res){
  
})

app.get('/getRoom', function(req, res) {
  res.send(store.get("room"));
});

app.get('/getRootHash', function(req,res){
  res.send(store.get("hash"))
})


server.listen(3000, 'localhost');
server.on('listening', function() {
    console.log('Express server started on port %s at %s', server.address().port, server.address().address);
});
