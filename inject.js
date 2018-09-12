var path = require('path')
var home = require('os-homedir')

var nonPrivate = require('non-private-ip')
var merge = require('deep-extend')

var RC = require('rc')

var SEC = 1e3
var MIN = 60*SEC

module.exports = function (name, override) {
  name = name || 'ssb'
  var HOME = home() || 'browser' //most probably browser
  return RC(name || 'ssb', merge({
    //just use an ipv4 address by default.
    //there have been some reports of seemingly non-private
    //ipv6 addresses being returned and not working.
    //https://github.com/ssbc/scuttlebot/pull/102
    party: true,
    host: nonPrivate.v4 || '',
    port: 8008,
    timeout: 0,
    pub: true,
    local: true,
    friends: {
      dunbar: 150,
      hops: 3
    },
    ws: {
      port: 8989
    },
    gossip: {
      connections: 3
    },
    connections: {
      incoming: {
        net: [{ port: 8008, scope: "public", "transform": "shs" }]
      },
      outgoing: {
        net: [{ transform: "shs" }]
      }
    },
    path: path.join(HOME, '.' + name),
    timers: {
      connection: 0,
      reconnect: 5*SEC,
      ping: 5*MIN,
      handshake: 5*SEC
    },
    //change these to make a test network that will not connect to the main network.
    caps: {
      //this is the key for accessing the ssb protocol.
      //this will be updated whenever breaking changes are made.
      //(see secret-handshake paper for a full explaination)
      //(generated by crypto.randomBytes(32).toString('base64'))
      shs: '1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s=',

      //used to sign messages
      sign: null
    },
    master: [],
    logging: { level: 'notice' },
    party: true //disable quotas
  }, override || {}))
}












