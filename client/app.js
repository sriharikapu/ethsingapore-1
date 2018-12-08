var express = require('express');
var http = require('http');
const Store = require('data-store');
var path = require('path');
const lib = require('../lib/lib.js');

lib((error, api) => {
  if (error) {
    console.log(error)
    process.exit()
  } else{
     main();
  }
})

function main(){
  const store = new Store({ path: 'config.json' });
  store.set("hash", process.argv[2])
  store.set("topic", process.argv[3])

  var app = express();
  var server = http.createServer(app);

  app.get('/', function(req, res) {
     res.sendFile(path.join(__dirname + '/index.html'));
  });

  app.get('/getBlockNumber', function(req, res){
    api.getBlockNumber(store.get("hash"), (error, number) =>{
      if(error){
        console.log(error)
      } else{
        res.json(number)
      }
    })
  })

  app.get('/getTopic', function(req, res) {
    res.send(store.get("topic"));
  });

  app.get('/getRootHash', function(req, res){
    var hash = api.getRootHash(store.get("topic"))
    res.send(hash)
    store.set("hash", hash)
  })

  app.post('/changeTopic', function(req, res){
   api.changeTopic(req.query.topic, error => {
     if (error) {
       console.log(error)
     } else {
        store.set("topic",req.query.topic)
     }
   })
  })

  server.listen(3000, 'localhost');
  server.on('listening', function() {
      console.log('Express server started on port %s at %s', server.address().port, server.address().address);
  });
}
