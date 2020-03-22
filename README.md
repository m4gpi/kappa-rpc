# KappaRPC

Everyone sharing a KappaRPC across a given address will execute a set of functions. Each peer defines this set of functions locally as a set of types and methods. Our types get shared across the hypercore-protocol to other peers on a given address. This is done using multifeed and kappa-core. These types replicate this address, so each peer knows which types each other has implemented, and this which methods they can execute on each remote peer. As long as peers continue to define and use those functions, they can be called remotely.

Treat each method defined as a command action, and each command type must implement a corresponding set of functions, CRUD perhaps, but also more? This can be flexible.

## How to use
Pass in a set of `types`, and a set of `methods`. These take the form defined by JSON schema.

In our `types` we're defining the format the request and response messages will take.

```js
// types.js

module.exports = {
  replicate: {
    type: 'object',
    required: ['peerId', 'address'],
    properties: {
      peerId: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{0,64}$'
      },
      address: {
        type: 'string',
        pattern: '^[0-9a-fA-F]{0,64}$'
      }
    }
  },
  signature: {
    type: 'string',
    pattern: '^[0-9a-fA-F]{0,128}$'
  }
}
```
Each time a function is implemented, a message containing a signature will be published referencing the id of the requesting message acting as a confirmation.

Then in our `methods`, we actually implement them. Each time a remote command is received and indexed, it will trigger it's corresponding method, with the command message as attached parameters.

```js
// methods.js

// define your own database and/or include your own functionality to use in the execute commands
const db = require('./db')
const authorise = require('./authorise')

module.exports = {
  createReplicate: {
    description: 'ask peer to begin replicating on given address, returns a confirmation signature and the original params',
    params: ['replicate'],
    returns: ['signature'],
    execute: (rpc, command) => {
      // command contains:
      // {
      //   publicKey, // this is either the feed key, or another custom field, e.g. our boxKeyPair public key
      //   params // the message / command sent by the peer
      // }

      return new Promise((resolve, reject) => {
        // execute your own controller logic, for example:

        // check the requesting peer has local permissions to execute this command
        let can = authorise(params.publicKey)
        if (!can) return reject(new AuthorisationError(params.publicKey))

        // store the details locally and begin replicating on that address
        db.replicators.create(params)
          .then((replicator) => {
            replicator.swarm()
            let signature = genSig(params)
            rpc.publish(signature, resolve) // sends a response
          })
          .catch((err) => {
            let error = generateError(params)
            rpc.publish(error, resolve)
          })
        }
      })
    }
  },
  deleteReplicate: {
    description: 'ask peer to stop replicating on given address, returns a confirmation signature and the original params',
    params: ['replicate'],
    returns: ['signature'],
    execute: (rpc, command) => {
      return new Promise((resolve, reject) => {
        // here we'd want to do some form of validation and authorization
        // then execute the create replicate action and resolve the promise
      })
    }
  }
}
```

Now initialize your `kappa-rpc` passing in the methods and types.

```js
const RPC = require('kappa-rpc')
const sodium = require('sodium-native')

// require your own definitions
const methods = require('./methods')
const types = require('./types')

var rpc = RPC({
  types, // required
  methods, // required
  core, // optional: pass in your own existing kappa-core
  feeds, // optional: pass in your own existing multifeed
  indices // optional: pass in additional index definitions, defined in our [indices schema]()
})

let details = await rpc.describe('replicate')
// {
//   "description": "tells peer to begin replicating on given address, returns replicator details once remote execution order received",
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
// e.g. '4eeb77c9e92a65d65e36e2126eb17ec2a9f2b3e1ab2d7fe82384a3fae9aef765'

let address = crypto.randomBytes(32).toString('hex')
// e.g. 'b03d6e7fbe3cef0355df7a29dea12a6e82c52215da3a3ac9e14f3ca349658767'

// this will wait for the remote peer to respond, so this may be very fast, or may not execute for some time, depending on the peer's connectivity.
// If we restart the process, kappa-rpc will rebuild the state of our RPC from our indexes, and reassign any outstanding unexecuted event listeners.

rpc.api.createReplicate({ peerId: remotePeerId, address })
  .on('request', (err, req) => {
    console.log(req)
    // {
    //   peerId: '4eeb77c9e92a65d65e36e2126eb17ec2a9f2b3e1ab2d7fe82384a3fae9aef765',
    //   address: 'b03d6e7fbe3cef0355df7a29dea12a6e82c52215da3a3ac9e14f3ca349658767'
    // }
    console.log("we've asked! now lets wait and see...")
  })
  .on('response', (err, res) => {
    console.log(res)
    // {
    //   signature: '5263a82a6c46144a48eef267bb8a80693bfe8b5a8d17b5e7b5569f1148d26bf9a66cf62c58321ec1d58e602910669448b65244762bb0577222811a5244d7131045879f385a08dd2ffd21d815a02be44a2a4993e63279f3144992f1458b08aa64c13a96c0f633fd66b039cb2157a266f796b2769078f6bb555e29aef63e3d1b9f'
    // {
    let success = checkSig(res.signature)
    if (!success) throw new Error('invalid signature, remote peer did something unexpected...')
    else console.log('wahay! remote peer did the thing you askded')
  })

function boxKeyPair () {
  const publicKey = sodium.sodium_malloc(sodium.crypto_box_PUBLICKEYBYTES)
  const secretKey = sodium.sodium_malloc(sodium.crypto_box_SECRETKEYBYTES)
  sodium.crypto_box_keypair(publicKey, secretKey)
  return { publicKey, secretKey }
}
```

`rpc` returns a kappa-rpc instance with an API to call the predefined functions across the hypercore-protocol.

## API

`rpc.describe(method)`
`rpc.api`
`rpc.feeds`
`rpc.views`
`rpc.core`
