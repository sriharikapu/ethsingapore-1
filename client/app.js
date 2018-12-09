const express = require('express');
const http = require('http');
const Store = require('data-store');
const path = require('path');
const lib = require('../lib/lib.js');
const body_parser = require('body-parser')

lib((error, api) => {
  if (error) {
    console.log(error)
    process.exit()
  } else{
    main(api);
  }
})

function main(api) {
  const store = new Store({ path: 'config.json' });
  store.set("hash", process.argv[2])
  store.set("topic", process.argv[3])

  var app = express()
  app.use(body_parser.json())
  app.use(body_parser.urlencoded({ extended: true }))

  app.get('/', function(req, res) {
     res.sendFile(path.join(__dirname + '/index.html'));
  })

  app.get('/getBlockNumber', function(req, res) {
    api.getBlockNumber(store.get('hash'), (error, number) =>{
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

  app.get('/getRootHash', function(req, res) {
    var hash = api.getRootHash()
    res.send(hash)
  })

  app.get('/getBlockByNumber', function (req, res) {
    console.log(store.get('hash'))
    console.log(req.query.blocknumber)
    console.log(req.query.tx)
    api.getBlockByNumber(store.get('hash'), req.query.blocknumber, req.query.tx, (error, block) => {
      if (error) {
        console.log(error)
      } else {
        res.send(block)
      }
    })
  })

  app.get('/getBlockTrasactionCount', function (req, res) {
    api.getBlockByNumber(store.get('topic'), req.query.blocknumber, (error, count) => {
      if (error) {
        console.log(error)
      } else {
        res.send(count)
      }
    })
  })

  app.post('/changeAuthority', function (req, res) {
    api.changeAuthority(req.query.authority) 
  })

  app.post('/changeRoot', function (req, res) {
    api.changeRoot(req.body.roothash)
    store.set('hash', req.body.roothash)
    res.redirect('/')
  })

  app.post('/changeTopic', function(req, res) {
   api.changeTopic(req.query.topic, error => {
     if (error) {
       console.log(error)
     } else {
        store.set("topic", req.query.topic)
     }
   })
  })

  app.listen(3000, () => {
    console.log('Server listening on port 3000')
  })
  /*
  var server = http.createServer(app);
  server.listen(3000, 'localhost');
  server.on('listening', function() {
      console.log('Express server started on port %s at %s', server.address().port, server.address().address);
  });
  */
}
