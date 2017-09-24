const Promise = require('any-promise')

function defer() {
  let resolve
  let reject

  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })

  return {
    promise,
    resolve,
    reject
  }
}

class Channel {
  constructor() {
    this.inputs = []
    this.requests = []
    this.final = null
  }

  give(value) {
    let deferred
    if (this.requests.length) {
      deferred = this.requests.shift()
    } else {
      deferred = defer()
      this.inputs.push(deferred)
    }

    deferred.resolve({
      value,
      done: false
    })
  }

  take() {
    if (this.final) {
      return this.final.promise
    }

    let deferred
    if (this.inputs.length) {
      deferred = this.inputs.shift()
    } else {
      deferred = defer()
      this.requests.push(deferred)
    }

    return deferred.promise
  }

  giveBack(value) {
    let deferred
    if (this.requests.length) {
      deferred = this.requests.shift()
    } else {
      deferred = defer()
      this.inputs.unshift(deferred)
    }

    deferred.resolve({
      value,
      done: false
    })
  }

  error(err) {
    const deferred = defer()
    deferred.reject(err)
    this.final = deferred

    let request
    while (request = this.requests.shift()) {
      request.reject(err)
    }
  }

  close(value) {
    const data = {
      value: value,
      done: true
    }

    const deferred = defer()
    deferred.resolve(data)
    this.final = deferred

    let request
    while (request = this.requests.shift()) {
      request.resolve(data)
    }
  }
}

module.exports = Channel
