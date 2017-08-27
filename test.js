const tap = require('tap')
const Channel = require('./')

function uid() {
  return new Buffer(Math.random().toString(35).substr(2, 16))
}

tap.test('give and take', async (t) => {
  const channel = new Channel()
  const sent = []
  const n = 100

  for (let i = 0; i < n; i++) {
    const value = uid()
    channel.give(value)
    sent.push(value)
  }

  const tasks = sent.map(() => channel.take())
  const responses = await Promise.all(tasks)
  const received = responses
    .filter(({ done }) => !done)
    .map(({ value }) => value)

  t.match(
    Buffer.concat(received),
    Buffer.concat(sent),
    'received list matches sent list'
  )

  t.end()
})

tap.test('give back', async (t) => {
  const channel = new Channel()
  const sent = []
  const n = 100

  for (let i = 0; i < n; i++) {
    const value = uid()
    channel.give(value)
    sent.push(value)
  }

  // Should return to original state after taking and giving back
  const num = await channel.take()
  t.match(num, {
    value: sent[0],
    done: false
  })
  channel.giveBack(num.value)

  const tasks = sent.map(() => channel.take())
  const responses = await Promise.all(tasks)
  const received = responses
    .filter(({ done }) => !done)
    .map(({ value }) => value)

  t.match(
    Buffer.concat(received),
    Buffer.concat(sent),
    'received list matches sent list'
  )

  t.end()
})

tap.test('error finalization', async (t) => {
  const error = new Error('test')
  const channel = new Channel()
  channel.error(error)

  // End
  try {
    await channel.take()
    t.fail('should have failed')
  } catch (err) {
    t.match(err, error, 'received error')
  }

  // End repeats due to finalization
  try {
    await channel.take()
    t.fail('should have failed')
  } catch (err) {
    t.match(err, error, 'received error again')
  }

  t.end()
})

tap.test('close finalization', async (t) => {
  const channel = new Channel()
  channel.close()

  t.match(await channel.take(), { done: true }, 'received done flag')
  t.match(await channel.take(), { done: true }, 'received done flag again')

  t.end()
})
