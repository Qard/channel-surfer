'use strict'

const defer = require('any-deferred')

class ChannelItem {
  constructor (request) {
    this.sender = defer()
    this.receiver = defer()
    this.request = request
    this.next = null
  }

  consume () {
    if (this.request) setImmediate(this.request)
    return this.sender.promise
  }

  // Non-destructive traversal--there may already be
  // an input or output in the queue
  ensureNext () {
    if (!this.next) {
      this.next = new ChannelItem(this.receiver.resolve)
    }
    return this.next
  }

  // This allows you to insert new items at the start
  wrap () {
    const { request } = this
    const item = new ChannelItem(request)
    this.request = item.receiver.resolve
    item.next = this
    return item
  }

  send (value) {
    this.sender.resolve({
      done: false,
      value
    })
    return this.receiver.promise
  }

  error (error) {
    this.sender.reject(error)

    // Ensure the tail is finalized
    if (this.next && this.next !== this) {
      this.next.error(error)
    }
    this.next = this
    return this.receiver.promise
  }

  close (value) {
    this.sender.resolve({
      done: true,
      value
    })

    // Ensure the tail is finalized
    if (this.next && this.next !== this) {
      this.next.close(value)
    }
    this.next = this
    return this.receiver.promise
  }
}

module.exports = ChannelItem
