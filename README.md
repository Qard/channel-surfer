# channel-surfer

Promise-based CSP channels, with async iterator support.

## Install

```sh
npm install channel-surfer
```

## Usage

```js
const Channel = require('channel-surfer')
const chan = new Channel()

// Consume with a simple `for await` loop

async function asyncAwaitConsumer() {
  for await (let message of chan) {
    console.log('received', message)
  }
}

// Or use the underlying promises with `channel.next()`

function manualConsumer () {
  channel.next().then(message => {
    console.log('received', message)
  }).then(manualConsumer)
}

setInterval(() => {
  chan.give('hello')
}, 100)
```

## API

### new Channel(): Channel

Create a new channel

```js
const channel = new Channel()
```

### channel.give(value: any): void

Give a value to the channel.

```js
channel.give('hello')
```

### channel.next(): Promise<IteratorItem<any>>

Receive a value from the channel. Note that the final item in the channel will cycle to itself, so further calls to this method will continue to return the final item.

```js
channel.next() // { done: false, value: 'hello' }
```

### channel.close(): void

Close the channel to indicate no more values will be sent. This is required for a `for await` loop to complete.

```js
channel.close()
```

### channel.error(error: any): void

Send an error to the channel and then close it.

```js
channel.error(new Error('oh no!'))
```

### channel.giveBack(value: any): void

Put a value at the top of the queue, to be received by the next request.

```js
channel.giveBack('hello')
```

---

### Copyright (c) 2019 Stephen Belanger

#### Licensed under MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
