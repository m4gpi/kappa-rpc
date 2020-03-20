const multifeed = require('multifeed')
const Kappa = require('kappa-core')

module.exports = function (opts) {
  const {
    types,
    methods,
    core = new Kappa(),
    indices = DEFAULT_INDICES
  } = opts

  return new Promise((resolve, reject) => {
    if (!body) {
      throw new (`rpc request was expecting some data...!`);
    }
    let _json = JSON.parse(body); // might throw error
    let keys = Object.keys(_json);
    let promiseArr = [];

    for (let key of keys) {
      if (methods[key] && typeof (methods[key].exec) === 'function') {
        let execPromise = methods[key].exec.call(null, _json[key]);
        if (!(execPromise instanceof Promise)) {
          throw new Error(`exec on ${key} did not return a promise`);
        }
        promiseArr.push(execPromise);
      } else {
        let execPromise = Promise.resolve({
          error: 'method not defined'
        })
        promiseArr.push(execPromise);
      }
    }

    Promise.all(promiseArr).then(iter => {
      console.log(iter);
      let response = {};
      iter.forEach((val, index) => {
        response[keys[index]] = val;
      });

      resolve(response)
    }).catch(err => {
      reject(err)
    })
  })
}
