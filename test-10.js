'use strict'

const tap = require('tap')
const Channel = require('./')

function uid () {
  return Buffer.from(Math.random().toString(35).substr(2, 16))
}

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

function delay (ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms))
}

tap.test('backpressure', async (t) => {
  const channel = new Channel()
  let requesting = true
  const items = []
  const n = 5

  for (let i = 0; i < n; i++) {
    const value = uid()
    items.push(value)
  }

  async function produce () {
    for (let value of items) {
      requesting = false
      await channel.give(value)
      t.equal(requesting, true, 'should be waiting for data')
    }
    channel.close()
  }

  async function consume () {
    let i = 0
    for await (let value of channel) {
      const expected = items[i++]
      t.deepEqual(value, expected, 'received the expected value')
      await delay(1000)
      requesting = true
    }
    t.equal(i, n, 'received as many items as were sent')
  }

  await Promise.all([
    produce(),
    consume()
  ])
})
