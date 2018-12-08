const lib = require('./lib.js')
lib((error, api) => {
  if (error) {
    console.log(error)
  } else {
    console.log(api)
  }
})
