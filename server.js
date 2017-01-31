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
app.url = 'http://' + public_ip + ':' + port



// Cloudsim routes.
// We have dev servers and production servers. Prius Challenge is now
// production servers.

// const simulatorsRoute = 'https://devportal.cloudsim.io/simulators/'
const simulatorsRoute = 'https://portal.cloudsim.io/simulators'



// cloudsim-integration-test
const launchData = {
  region: 'us-west-1',
  hardware: 'g2.2xlarge',
  image:'ami-a64a17c6',  // this is version 0.8 of Prius Challenge.
  options: {
    role: 'Prius Challenge simulator',
  }
}

// FOR TESTING: repalce simulator with a cheap t2.micro
// launchData.hardware:'t2.micro'
// launchData.image: 'ami-37c19357'


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
  request.post(simulatorsRoute)
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

// get simulator info (for example the ip appears here after 10 secs)
app.get('/simulator/:simulator', function (req, res) {
  console.log('\n\nsimulator info')
  const simulator = req.simulator
  console.log('simulator: ' + simulator)

  request.get(simulatorsRoute + '/' + simulator)
    .set('Accept', 'application/json')
    .set('authorization', cloudsimToken)
    .send()
    .end( function (err, response) {
      console.log('response:', response.text)
      const result = JSON.parse(response.text)
      console.log('status:', response.status)
      const s = JSON.stringify(result, null, 2)
      console.log(s)
      res.status(response.status).jsonp(result)
    })

})

app.get('/terminate/:simulator', function (req, res) {
  console.log('\n\nterminate')
  const simulator = req.simulator
  console.log('simulator: ' + simulator)

  // DELETE request to /simulators
  request.delete(simulatorsRoute + '/' + simulator)
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
  const query = JSON.stringify(req.query)
  // save the date and query parameters
  const s = `[${date}] ${query}
`
  console.log(s)
  callbacks.push(s)
  res.end(s)

})

app.get('/callbacks', function (req, res) {

  res.jsonp(callbacks)

})

app.get('/clear_callbacks', function (req, res) {
  callbacks.length = 0
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
