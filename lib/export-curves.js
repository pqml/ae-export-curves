const aeToJSON = require('ae-to-json/after-effects')
const ae = require('after-effects')
const collect = require('./collect')

let data = null

function read () {
  return new Promise((resolve, reject) => {
   ae.execute(aeToJSON)
     .then(json => { data = json })
     .then(resolve)
     .catch(reject)
  })
}

function curves (config) {
  return new Promise((resolve, reject) => {
    Promise.resolve()
      .then(() => !data ? read() : Promise.resolve())
      .then(() => collect(data, config))
      .then(resolve)
      .catch(reject)
  })
}

module.exports = curves