# README #

This is part of the [Cloudsim](https://bitbucket.org/osrf/cloudsim) project

[demo](http://52.53.158.228:8080/demo.html)

Web app to test various Cloudsim integrations.

This repo contains

* A server with a demo page
* Tests (that use that server)

### Setup ###

You must run this on a cloud server, because it will be contacted by simulators
(via a curl on the /callback route)

You must provide a .env file with the following structure in the root directory:

`

# Portal url (dev, production, other?)
PORTAL_URL="https://devportal.cloudsim.io

# this token must have permission to launch simulators on the portal
TOKEN="eyJhdsf .... rest of token ..... NIrwlEuljnXb3w"


`

Once the .env file is in place, install the node packages:

`npm install`

### How to run interactively ###

Start the server:

`npm start`

Then point your browser to `http://xx.xx.xx.xx:5001/demo.html`
(replace xx.xx.xx.x with the ip of the cloud server, make sure the port is open)

From there, follow the instructions on the web page.


Tests:

`npm test`

