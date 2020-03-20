# KappaRPC

Everyone sharing a KappaRPC across a given address will execute a set of functions. Each peer defines this set of functions locally as a set of types and methods. Our types get shared across the hypercore-protocol to other peers on a given address. This is done using multifeed and kappa-core. These types replicate this address, so each peer knows which types each other has implemented, and this which methods they can execute on each remote peer. As long as peers continue to execute those functions, they can be called remotely.

Treat each method defined as a command type, and each command type must implement a corresponding set of functions, CRUD perhaps, but also more? This can be flexible.

## How to use
Pass in a set of `types`, and a set of `methods`.

In your `types` you're promising you're going to implement a set of functionality so remote peers can execute that functionality on your device.

```
// types.js

module.exports = {
  replicate: {
    required: ['name', 'address'],
    properties: {
      peerId: {
        type: 'string',
        format: '^[0-9a-fA-F]{0,64}$'
      },
      address: {
        type: 'string',
        format: '^[0-9a-fA-F]{0,64}$'
      }
    }
  }
}
```
Each time a function is implemented, a message containing a signature will be published referencing the id of the requesting message acting as a confirmation.

Then in our `methods`, we actually implement them.

```js
// methods.js

let view // TODO

module.exports = {
  createReplicate: {
    description: 'ask peer to begin replicating on given address, returns a confirmation signature and the original params',
    params: ['replicate'],
    returns: ['signature'],
    execute: (command) => {
      return new Promise((resolve) => {
        // here we'd want to do some form of validation and authorization
        // then execute the create replicate action and resolve the promise
      })
    }
  },
  deleteReplicate: {
    description: 'ask peer to stop replicating on given address, returns a confirmation signature and the original params',
    params: ['replicate'],
    returns: ['signature'],
    execute: (command) => {
      return new Promise((resolve) => {
        // here we'd want to do some form of validation and authorization
        // then execute the create replicate action and resolve the promise
      })
    }
  }
}
```

Now initialize your `kappa-rpc` passing in the methods and types.

```
const RPC = require('kappa-rpc')
const sodium = require('sodium-native')

// require your own definitions
const methods = require('./methods')
const types = require('./types')

var rpc = RPC({
  types, // required
  methods, // required
  core, // optional: pass in your own existing kappa-core
  indices // optional: pass in additional index definitions, defined in our [indices schema]()
})

let details = await rpc.describe('replicate')
// {
//   "description": "tells peer to begin replicating on given address, returns a replicator details once remote execution order received",
//   "required": ["peerId", "address"],
//   "params": [{
//     "peerId": {
//       "type": "string",
//       "format": "^[0-9a-fA-F]{0,64}$"
//     },
//     "address": {
//       "type": "string",
//       "format": "^[0-9a-fA-F]{0,64}$"
//     }
//   }]
// }

let remotePeerId = crypto.boxKeyPair().publicKey.toString('hex')
let address = crypto.randomBytes(32).toString('hex')

let details = await rpc.api.replicate({ peerId: remotePeerId, address })
// {
//   peerId: {
//     type: 'string',
//     format: '^[0-9a-fA-F]{0,64}$'
//   },
//   address: {
//     type: 'string',
//     format: '^[0-9a-fA-F]{0,64}$'
//   }
// {

function boxKeyPair () {
  const publicKey = sodium.sodium_malloc(sodium.crypto_box_PUBLICKEYBYTES)
  const secretKey = sodium.sodium_malloc(sodium.crypto_box_SECRETKEYBYTES)
  sodium.crypto_box_keypair(publicKey, secretKey)
  return { publicKey, secretKey }
}
```

`rpc` returns a kappa-rpc instance with an API to call the predefined functions across the hypercore-protocol.

`kappa-rpc` uses `kappa-view-query` to build a set of indices and easily search inside hypercores defined only by itself and other peer's rpc cores.

## API


```

```



