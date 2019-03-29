'use strict'

const { deprecate } = require('util')
const ChannelItem = require('./item')

/**
 * The channel class uses a single-direction linked-list
 * with two pointers to track the position of input and
 * output cursors in a theoretically infinite sequence.
 * By shifting the pointers, any event that has had both
 * input and output completions will drop out of scope
 * and get garbage collected automatically.
 *
 * Because the functional behaviour of a channel is a
 * race between two sides, the internal linked-list will
 * always cover only the span between the input and output
 * pointers. This design enables optimal memory usage for
 * a lossless stream.
 *
 * To finalize the sequence in a way that mirrors the
 * behaviour of iterators, an error or close event will
 * create an item in the list which forms a circular
 * reference to itself. By doing this, future requests
 * beyond the end of the sequence will just repeatedly
 * return the final event indicating the done state.
 */
class Channel {
  constructor () {
    this.input = new ChannelItem()
    this.request = this.input
  }

  give (value) {
    const { input } = this
    this.input = input.ensureNext()
    input.send(value)
  }

  next () {
    const { request } = this
    this.request = request.ensureNext()
    return request.promise
  }

  giveBack (value) {
    const { input, request } = this

    // No pending requests or inputs
    if (!request.next && !input.next) {
      return this.give(value)
    }

    // If there are pending inputs, create a
    // new request and move the request pointer
    let item = input
    if (request.next) {
      item = request.wrap()
      this.request = item
    }

    item.send(value)
  }

  error (error) {
    this.input.error(error)
  }

  close () {
    this.input.close()
  }

  [Symbol.asyncIterator] () {
    return this
  }
}

Channel.prototype.take = deprecate(function take () {
  return this.next()
}, 'The channel.take() function is deprecated, please use channel.next() or for await loops.')

module.exports = Channel
