'use strict'

const tap = require('tap')
const Channel = require('./')

function uid () {
  return Buffer.from(Math.random().toString(35).substr(2, 16))
}

tap.test('give then next - alternating', (t) => {
  const channel = new Channel()
  const tasks = []
  const sent = []
  const n = 100

  for (let i = 0; i < n; i++) {
    const value = uid()
    channel.give(value)
    tasks.push(channel.next())
    sent.push(value)
  }

  return Promise.all(tasks).then((responses) => {
    const received = responses
      .filter(({ done }) => !done)
      .map(({ value }) => value)

    t.match(
      Buffer.concat(received),
      Buffer.concat(sent),
      'received list matches sent list'
    )
  })
})

tap.test('give then next - bulk', (t) => {
  const channel = new Channel()
  const sent = []
  const n = 100

  for (let i = 0; i < n; i++) {
    const value = uid()
    channel.give(value)
    sent.push(value)
  }

  const tasks = sent.map(() => channel.next())

  return Promise.all(tasks).then((responses) => {
    const received = responses
      .filter(({ done }) => !done)
      .map(({ value }) => value)

    t.match(
      Buffer.concat(received),
      Buffer.concat(sent),
      'received list matches sent list'
    )
  })
})

tap.test('next then give - alternating', (t) => {
  const channel = new Channel()
  const tasks = []
  const sent = []
  const n = 100

  for (let i = 0; i < n; i++) {
    const value = uid()
    tasks.push(channel.next())
    channel.give(value)
    sent.push(value)
  }

  return Promise.all(tasks).then((responses) => {
    const received = responses
      .filter(({ done }) => !done)
      .map(({ value }) => value)

    t.match(
      Buffer.concat(received),
      Buffer.concat(sent),
      'received list matches sent list'
    )
  })
})

tap.test('next then give - bulk', (t) => {
  const channel = new Channel()
  const tasks = []
  const n = 100

  for (let i = 0; i < n; i++) {
    tasks.push(channel.next())
  }

  const sent = tasks.map(() => {
    const value = uid()
    channel.give(value)
    return value
  })

  return Promise.all(tasks).then((responses) => {
    const received = responses
      .filter(({ done }) => !done)
      .map(({ value }) => value)

    t.match(
      Buffer.concat(received),
      Buffer.concat(sent),
      'received list matches sent list'
    )
  })
})

tap.test('give back', (t) => {
  const channel = new Channel()
  const sent = []
  const n = 100

  for (let i = 0; i < n; i++) {
    const value = uid()
    channel.give(value)
    sent.push(value)
  }

  const tasks = []
  for (let i = 0; i < 10; i++) {
    tasks.push(channel.next())
  }

  // Should return to original state after taking and giving back
  return Promise.all(tasks)
    .then((nums) => {
      t.equal(nums.length, 10)
      // Loop backwards, so we giveBack in the right order
      for (let i = 9; i >= 0; i--) {
        const { done, value } = nums[i]
        t.notOk(done)
        t.equal(value, sent[i])
        channel.giveBack(value)
      }
    })
    .then(() => Promise.all(sent.map(() => channel.next())))
    .then((responses) => {
      const received = responses
        .filter(({ done }) => !done)
        .map(({ value }) => value)

      t.match(
        Buffer.concat(received),
        Buffer.concat(sent),
        'received list matches sent list'
      )
    })
})

tap.test('give back to empty state', (t) => {
  const channel = new Channel()

  const expected = uid()
  channel.giveBack(expected)

  return channel.next()
    .then(({ value }) => {
      channel.close()
      t.equal(value, expected)
    })
})

tap.test('give back while waiting', (t) => {
  const channel = new Channel()

  const expected = uid()
  channel.give(expected)

  const a = channel.next()
  const b = channel.next()

  return a.then(({ value }) => {
    channel.giveBack(value)
    return b
  }).then(({ value }) => {
    t.equal(value, expected)
  })
})

tap.test('error finalization', (t) => {
  const error = new Error('test')
  const channel = new Channel()
  channel.error(error)

  // End
  return channel.next()
    .then(
      () => t.fail('should have failed'),
      (err) => t.match(err, error, 'received error')
    )
    // End repeats due to finalization
    .then(() => channel.next())
    .then(
      () => t.fail('should have failed'),
      (err) => t.match(err, error, 'received error again')
    )
})

tap.test('error finalization while waiting', (t) => {
  const error = new Error('test')
  const channel = new Channel()
  const a = channel.next()
  channel.error(error)

  // End
  return a
    .then(
      () => t.fail('should have failed'),
      (err) => t.match(err, error, 'received error')
    )
    // End repeats due to finalization
    .then(() => channel.next())
    .then(
      () => t.fail('should have failed'),
      (err) => t.match(err, error, 'received error again')
    )
})

tap.test('close finalization', (t) => {
  const channel = new Channel()
  channel.close()

  return channel.next()
    .then(
      (value) => t.match(value, { done: true }, 'received done flag'),
      () => t.fail('should not have errored')
    )
    .then(() => channel.next())
    .then(
      (value) => t.match(value, { done: true }, 'received done flag again'),
      () => t.fail('should not have errored')
    )
})

tap.test('close finalization while waiting', (t) => {
  const channel = new Channel()
  const a = channel.next()
  channel.close()

  return a
    .then(
      (value) => t.match(value, { done: true }, 'received done flag'),
      () => t.fail('should not have errored')
    )
    .then(() => channel.next())
    .then(
      (value) => t.match(value, { done: true }, 'received done flag again'),
      () => t.fail('should not have errored')
    )
})

// Version-restricted tests
const [ major ] = process.versions.node.split('.').map(Number)
if (major >= 10) require('./test-10')

if (major >= 8) {
  tap.test('take emits deprecation warning', (t) => {
    const emitWarning = process.emitWarning
    process.emitWarning = (message) => {
      t.equal(message, 'The channel.take() function is deprecated, please use channel.next() or for await loops.')
      t.end()
    }
    t.on('end', () => {
      process.emitWarning = emitWarning
    })

    const channel = new Channel()
    channel.take()
  })
}
