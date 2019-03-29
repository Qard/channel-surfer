'use strict'

const tap = require('tap')
const Channel = require('./')

tap.test('async iteration', async (t) => {
  const channel = new Channel()
  channel.give(1)
  channel.give(2)
  channel.close()

  let i = 0
  for await (let result of channel) {
    t.equal(++i, result, `result is ${i}`)
  }

  t.equal(i, 2, `received ${i} items`)
  t.end()
})
