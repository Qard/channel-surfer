'use strict'

const defer = require('any-deferred')

class ChannelItem {
  constructor () {
    const { promise, resolve, reject } = defer()
    this.promise = promise
    this.resolve = resolve
    this.reject = reject
    this.next = null
  }

  // Non-destructive traversal--there may already be
  // an input or output in the queue
  ensureNext () {
    if (!this.next) {
      this.next = new ChannelItem()
    }
    return this.next
  }

  // This allows you to insert new items at the start
  wrap () {
    const item = new ChannelItem()
    item.next = this
    return item
  }

  send (value) {
    this.value = value
    this.resolve({
      done: false,
      value
    })
  }

  error (error) {
    this.reject(error)

    // Ensure the tail is finalized
    if (this.next) {
      this.next.reject(error)
    }
    this.next = this
  }

  close (value) {
    this.resolve({
      done: true,
      value
    })

    // Ensure the tail is finalized
    if (this.next) {
      this.next.close(value)
    }
    this.next = this
  }
}

module.exports = ChannelItem
