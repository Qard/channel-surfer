'use strict'

const Channel = require('./')
const { PassThrough } = require('stream')

const mode = process.argv[2] || 'channel'
const highWatermark = process.argv[3] || 16384
const bytes = {}

const iter = mode === 'channel'
  ? new Channel()
  : new PassThrough({ highWatermark })

function uid () {
  return Buffer.from(Math.random().toString(35).substr(2, 16))
}

const id = uid()

async function consume (name) {
  bytes[name] = 0
  for await (let chunk of iter) {
    bytes[name] += chunk.length
  }
}

const produce = mode === 'channel'
  ? async () => {
    let bytes = 0
    while (true) {
      bytes += id.length
      const p = iter.give(id)
      if (bytes >= highWatermark) {
        bytes = 0
        await p
      }
    }
  }
  : () => {
    while (iter.write(id));
    iter.once('drain', () => setImmediate(produce))
  }

Promise.all([
  produce(),
  consume(mode)
]).catch(console.error)

setInterval(() => {
  for (let [ key, value ] of Object.entries(bytes)) {
    console.log(`${key} - ${value} bytes/sec`)
    bytes[key] = 0
  }
}, 1000)
