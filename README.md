# ssb-config

Configuration module useful for starting an [`ssb-server`](https://github.com/ssbc/ssb-server).

## example usage

```js
var Server = require("ssb-server");
var config = require("ssb-config");

var server = Server(config);
server.whoami((err, feed) => {
  console.log(feed);

  server.close(() => console.log("closing the server!"));
});
```

Custom configutation (e.g. set up a test network that doesn't collide with main ssb network):

```js
// if you want to customise, e.g.
//

var Server = require("ssb-server");
var Config = require("ssb-config/inject");
var config = Config("testnet", { port: 9999 });

var server = Server(config);
server.whoami((err, feed) => {
  console.log(feed);

  server.close(() => console.log("closing the server!"));
});
```

## API

### `require('ssb-config')`

returns you the stock standard config for starting an `ssb-server`

### `require('ssb-config/inject')(appName, opts) => Object`

A function which takes:

- `appName` _(string)_ which declares where to look for further config, where to read and write databases. Stores data in `~/.${appName}`, defaults to `ssb` (so data in `~/.ssb`).
- `opts` _(object)_ an object which is fed into the config generation as a bunch of defaults (see 'Configuration' below)

## Configuration

All configuration is loaded via [`rc`](https://github.com/dominictarr/rc). This means the final config is a result of config collected from `opts` passed into the inject method, cli args, env var, and config (e.g. `~/.ssb/config`). See the rc repo for full details.

Options:

- `path` _(string)_ Path to the application data folder, which contains the private key, message attachment data (blobs) and the leveldb backend. Defaults to `$HOME/.ssb`.
- `party` _(boolean)_ TODO
- `timeout`: _(number)_ Number of milliseconds a replication stream can idle before it's automatically disconnected. Defaults to `30000`.
- `connections` _(object)_ Details `incoming` and `outgoing` connections behaviour (see below)
- `pub` _(boolean)_ Replicate with pub servers. Defaults to `true`.
- `local` _(boolean)_ Replicate with local servers found on the same network via `udp`. Defaults to `true`.
- `friends.dunbar` _(number)_ [`Dunbar's number`](https://en.wikipedia.org/wiki/Dunbar%27s_number). Number of nodes your instance will replicate. Defaults to `150`.
- `friends.hops` _(number)_ How many friend of friend hops to replicate. Defaults to `3`.
- `gossip.connections` _(number)_ How many other nodes to connect with at one time. Defaults to `3`.
- `timers.connection` _(number)_ TODO
- `timers.reconnect` _(number)_ TODO
- `timers.ping` _(number)_ TODO
- `timers.handshake` _(number)_ TODO
- `caps.shs` _(string)_ Key for accessing the scuttlebutt protocol (see secret-handshake paper for a full explaination)
- `caps.sign` _(string)_ Used to sign messages
- `logging.level` _(string)_ How verbose should the logging be. Possible values are error, warning, notice, and info. Defaults to `notice`.
- `master` _(array)_ Pubkeys of users who, if they connect to the Scuttlebot instance, are allowed to command the primary user with full rights. Useful for remotely operating a pub. Defaults to `[]`.
- `remote` ... TODO ... a multisever address for ... (in the future this may be deprecated / derived from `connections`

Deprecated Options:

- `host` _(string)_ The domain or ip address for `sbot`. Defaults to your public ip address.
- `port` _(string|number)_ The port for `sbot`. Defaults to `8008`.
- `ws` TODO

You should use `connections` to more explicitly configure connections.
These values are currently only used to generate `connections.incoming` if that option isn't provided. The raw options are no longer returned in the final config - this is to ensure we don't have multiple places where different `host` / `port` / `ws` are being set!

### `connections`

An object with two required properties: `incoming` and `outgoing` to specify transports and transformations for connections.
Defaults to the following:

```json
{
  "incoming": {
    "net": [{ "port": 8008, "scope": "public", "transform": "shs" }]
  },
  "outgoing": {
    "net": [{ "transform": "shs" }]
  }
}
```

It specifies the default TCP `net`work transport for incoming and outging connections, using secret-handshake/boxstream ([shs](https://github.com/auditdrivencrypto/secret-handshake)) for authentication and encryption.

A **transport** is a vehicle or avenue for communication. The following transports are currently supported:

- `net` - TCP based
- `unix` - socket based
- `onion` - TOR based
- `ws` - websocket based

Each transport can have an array of different configurations passed to it, these are objects with properties:

- `transform` _(string)_ determines whether traffic is encrypted, and if so how.
  - `shs` - secret handashake
  - `noauth` - no encryption, any connection via `noauth` is considered authorized. **use only with `device` scope or unix socket**
- `port` _(integer)_
- `host` _(string)_ only relevant for ... TODO
- `scope` _(string|array(string))_ scope determines the set of network interfaces to bind the server to, and getAddress(scope) returns the relavant addresses. If scope is an array, then the server will bind to all the selected ports. default is `["device", "local", "public"]`.
  applies directly to tcp based transports (net, ws) but for other transports (unix, tor) is still important,
  because `getAddress('device')` should return a `unix` transport (if configured) because you can only connect to unix sockets if you have fs access,
  likewise, `onion` should be in the public scope, because you can connect to it over the internet.
  - `private` - bind only to _local network_ i.e. wifi/lan
  - `public` - bind to public ip address (it's likely you do not have a public address on an end device, but some networks do)
  - `local` - alias to private
  - `device` - "localhost". accessable only on the same device.
- `external` _(array of strings)_ ... for use in combination with public scope. this is the external domain given out as the address to peers.
- `server` - used for ws plugin to run over TLS. Needs to be an object that gets passed to [pull-ws](https://github.com/pull-stream/pull-ws). Two keys are needed: `key` - the private key and an `address` function that returns an object with a `port` key.

---

### Example `connnections` configurations

If you only want to use [Tor](https://torproject.org) to create outgoing connections you can specify your `outgoing` like this. It will use `localhost:9050` as the socks server for creating this.

```json
{
  "incoming": {
    "net": [{ "port": 8008, "scope": "public", "transform": "shs" }]
  },
  "outgoing": {
    "onion": [{ "transform": "shs" }]
  }
}
```

If you want to run a peer behind NAT or other kind of proxy but still want sbot to be able to create invites for the outside addres, you can specify a `public` scope as your `incoming.net` by defining the `external` parameter like this:

```json
{
  "incoming": {
    "net": [
      {
        "scope": "public",
        "external": ["cryptop.home"],
        "transform": "shs",
        "port": 8008
      },
      {
        "scope": "private",
        "transform": "shs",
        "port": 8008,
        "host": "internal1.con.taine.rs"
      }
    ]
  },
  "outgoing": {
    "net": [{ "transform": "shs" }]
  }
}
```

One thing to notice is that you _need_ `incoming` connections for Apps (like patchwork or git-ssb) to function. By default they use the same authentication mechanism (shs) to grant access to the database, choosing access levels depending on the keypair that opens the connection. If you connect to yourself, you get full access (query and publish). If a remote peer connects, it can only replicate. So be sure to have **at least one** `incoming` connection.

That being said, the overhead of encryption for local applications can be very high, especially on low-powered devices. For this use-case there is a `noauth` transform which by-passes the authentication and grants full access to anybody that can connect to it. **hint:** _This is risky! it might expose private messages or enables people to publish as you!_ Therefore be sure to bind the listener to `localhost` or use the `unix` socket. The `unix` file socket is creted as `$HOME/.ssb/socket` by default and has permissions such that only the user running `sbot server` can open it, just like the `.ssb/secret` file.

```json
{
  "incoming": {
    "unix": [{ "scope": "device", "transform": "noauth" }],
    "net": [
      {
        "scope": "device",
        "transform": "noauth",
        "port": 8009,
        "host": "localhost"
      }
    ]
  },
  "outgoing": {
    "net": [{ "transform": "shs" }]
  }
}
```

The local plugin inside scuttlebot will use the first incoming connection of either public or private scope.

## License

MIT
