'use strict'

const express = require('express')
const app = express()
const bodyParser = require("body-parser")
const cors = require('cors')
const morgan = require('morgan')
const dotenv = require('dotenv')
const http = require('http')
const request = require('superagent')
const child_process = require('child_process')

const httpServer = http.Server(app)

// the configuration values are set in the local .env file
// this loads the .env content and puts it in the process environment.
dotenv.load()

const port = process.env.PORT || 8080
// get our public ip for the callback
const public_ip = child_process.execSync("curl checkip.amazonaws.com").toString().trim()
app.url = public_ip + ':' + port

/*
const launchData = {
  region: 'us-west-1',
  hardware:'g2.2xlarge',
  image: 'ami-7ae3b01a',
  options: {
    role: 'Prius Challenge simulator',
    callback_ip: 'http://52.53.158.228',
    callback_hz_secs: 60,
    callback_token: 'THIS_IS_THE_CALLBACK_TOKEN'
  }
}
*/



// cloudsim-integration-test
const launchData = {
  region: 'us-west-1',
  hardware:'t2.micro',
  image: 'ami-0ca3f16c',
  options: {
    role: 'Prius Challenge simulator',
    callback_url: 'http://52.53.158.228:8080/callback',
    callback_hz_secs: 60,
    callback_token: 'THIS_IS_THE_CALLBACK_TOKEN'
  }
}

const cloudsimToken = process.env.TOKEN
console.log('cloudsim token:', cloudsimToken, '\n\n')
if (!cloudsimToken)
  throw ("no cloudsim token!")

// The Cross-Origin Resource Sharing standard
app.use(cors())
// Populates the body of each request
app.use(bodyParser.json())
// prints all requests to the terminal
app.use(morgan('combined'))


function details() {
  const date = new Date()
  const pack = require('./package.json')
  const env = app.get('env')

  const s = `
date: ${date}

${pack.name} version: ${pack.version}
${pack.description}
port: ${port}
environment: ${env}
`
  return s

}

// write details to the console
console.log('============================================')
console.log(details())
console.log('============================================')

app.get('/', function (req, res) {
  const info = details()
  const s = `
    <h1>Cloudsim-integration server</h1>
    <pre>
    ${info}
    </pre>
    <br><a href="/demo.html">demo</a>
  `
  res.end(s)
})

// this is a server route that generates a request to the portal
app.post('/launch', function (req, res) {

  // Here, post to the portal and send the result as is.
  request.post('https://devportal.cloudsim.io/simulators')
    .set('Accept', 'application/json')
    .set('authorization', cloudsimToken)
    .send(launchData)
    .end( function (err, response) {
    if(err) {
      console.log('error:', err)
      throw (err)
    }
    console.log('response:', response.text)
    const result = JSON.parse(response.text)
    res.status(response.status).jsonp(result)
  })
})

app.get('/terminate/:simulator', function (req, res) {
  console.log('terminate')
  const simulator = req.simulator
  console.log('simulator: ' + simulator)

  // DELETE request to /simulators
  request.delete('https://devportal.cloudsim.io/simulators/' + simulator)
    .set('Accept', 'application/json')
    .set('authorization', cloudsimToken)
    .send({})
    .end( function (err, response) {
      console.log('response:', response.text)
      const result = JSON.parse(response.text)
      console.log('status:', response.status)
      const s = JSON.stringify(result, null, 2)
      console.log(s)
      res.status(response.status).jsonp(result)
    })
})

// simulator query parameter
app.param('simulator', function( req, res, next, id) {
  req.simulator = id
  next()
})

// server the demo page
app.use(express.static('public'))


const callbacks = []
app.get('/callback', function (req, res) {
  const date = new Date()
  const s = `${date} callback!

`
  console.log(s)
  callbacks.push(s)
  res.end(s)

})

app.get('/callbacks', function (req, res) {

  res.jsonp(callbacks)

})



// share the server (for tests)
exports = module.exports = app

console.log('loading options.json...')

let options
try {
  options = require('./options.json')
  resources = options.resources
}
catch(e) {
  console.log('Error loading ./options.json:', e)
}

// start the server
httpServer.listen(port, function(){
  console.log('listening at', app.url)
})
