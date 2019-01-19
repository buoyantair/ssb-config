const Server = require('ssb-server')
  .use(require('ssb-server/plugins/master'))

const config = require('./server-custom-config')

const server = Server(config)
writeManifest(server)

process.on('message', msg => {
  if (msg.action === 'CLOSE') {
    server.close(() => {
      process.send({ action: 'KILLME' })
    })
  }
})

server.whoami((err, data) => {
  if (err) return server.close()

  console.log('> server started')
  setTimeout(() => process.send({ action: 'READY' }), 5)
})

function writeManifest (server) {
  var fs = require('fs')
  var Path = require('path')

  fs.writeFileSync(
    Path.join(server.config.path, 'manifest.json'),
    JSON.stringify(server.getManifest())
  )
}
