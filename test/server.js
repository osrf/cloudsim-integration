'use strict'

console.log('test/server.js')

const fs = require('fs')
const path = require('path')
const should = require('should')
const supertest = require('supertest')
const dotenv = require('dotenv')

// load secrets from .env file
dotenv.load()

// const log =  function(){}
const log = console.log

// before launching the server, we want to
// generate a cutom configuration


function parseResponse(text, show) {
  let res
  try {
    res = JSON.parse(text)
  }
  catch (e) {
    log('=== not valid JSON response! ===')
    log(text)
    log('========================')
    throw e
  }
  if(show){
    const s = JSON.stringify(res, null, 2)
    console.log(s)
  }
  return res
}


// things used in the tests
const token = process.env.TOKEN
// things to be defined shortly, and then used
// elsewhere.
let agent
let callbackUrl

describe('<Integration test Server>', function() {
  this.timeout(5 * 60 * 1000)  // 5 minutes
  before(function(done) {
      const app = require('../server')
      // this is the route we want to be called back on
      callbackUrl = app.url +  '/callback'
      agent = supertest.agent(app)
      // check that we have the token
      log('token:', token)
      if (!token) should.fail ('no token')
      done()
  })

/*
  describe ('This server', function() {
    it('Should be online', function(done) {

      done()
    })
  })
*/

  describe ('Test micro instance', function() {
    it('Should be possible to launch a simulator', function(done) {

        done()
    })

  })



  after(function(done) {
    log('after tests!')
    done()
  })

})

