---
layout: post
title: Asynchronous Python Queue
categories: python
comments: true
---

Futures (PEP 3148 <sup>[1][1]</sup>) and the `async` and `await` keywords (PEP 492 <sup>[2][2]</sup>) are relatively new additions to the Python core language. With them, Python has begun to make asynchronous programming a core part of its appeal. Asynchronous programming is a good choice when certain tasks take a long time to complete, but do not consume much CPU (eg. waiting for a database query or network communication). In such cases, an asynchronous program can continue with other tasks and pick up after previous tasks once they have completed. A word of caution, asynchronous programming is not concurrent programming.

There are plenty of good tutorials on how to use `async` and `await` where the long-running tasks are predefined <sup>[3][3], [4][4]</sup>. However, I couldn't find any tutorials on how to create a delay until certain condition were met. A good example to explore this is the `asyncio.Queue` implementation. This is an asynchronous queue with a threshold on the number of entities it can hold. "Getting" from the queue while it is empty should block until new entities are put and "putting" new entities in the queue while it is full should block until existing entities are gotten. The key to this is to use futures. Using `await` on a `Future` will cause a function to pause until the `Future` has been resolved. This means that a function can create a `Future` and `await` its resolution, which another function can do by calling its `set_result` member. Below is a somewhat trimmed version of what is found in the standard library.

```python
import asyncio

from collections import deque


class Queue:
    def __init__(self, maxsize=0, loop=None):
        self._loop = loop if loop else asyncio.get_event_loop()
        self._maxsize = maxsize

        self._getters = collections.deque()
        self._putters = collections.deque()
        
        self._queue = deque()

    def _wakeup_next(self, waiters):
        while waiters:
            waiter = waiters.popleft()
            if not waiter.done():
                waiter.set_result(None)
                break

    def empty(self):
        return not self._queue

    def full(self):
        if self._maxsize <= 0:
            return False
        else:
            return len(self._queue) >= self._maxsize

    async def put(self, item):
        while self.full():
            putter = self._loop.create_future()
            self._putters.append(putter)
            await putter
        self._queue.append(item)
        self._wakeup_next(self._getters)

    async def get(self):
        while self.empty():
            getter = self._loop.create_future()
            self._getters.append(getter)
            await getter
        item = self._queue.popleft()
        self._wakeup_next(self._putters)
        return item
```

One problem with the implementation is that there is no way to indicate to waiting `get` that no further items will be `put`. We can add an additional method called `close` that closes the queue, prevents new items from being `put` and throws an error once `Queue.putters` and `Queue._queue` is empty. Implementing this function also raises the possibility to iterate over the queue as shown below.

```python
    def __aiter__(self):
        return self
    
    async def __anext__(self):
        try:
            return await self.get()
        except QueueClosed:
            raise StopAsyncIteration
    
    async def close(self):
        self._closed = True

    def is_closed(self):
        return self._closed and len(self._queue) == 0 and len(self._putters) == 0
    
    async def put(self):
        if self._closed:
            raise QueueClosed
        while self.full():
            putter = self._loop.create_future()
            self._putters.append(putter)
            await putter
        self._queue.append(item)
        self._wakeup_next(self._getters)
    
    async def get(self):
        while self.empty():
            if self.is_closed():
                raise QueueClosed
            getter = self._loop.create_future()
            self._getters.append(getter)
            await getter
        item = self._queue.popleft()
        self._wakeup_next(self._putters)
        return item

class QueueClosed(Exception):
    pass
```

To run the code, I wrote asynchronous `putter` and `getter` functions that would `put` and `get` entities from the queue every 0.5 and 0.6 seconds, respectively. This should mean that the queue will slowly fill over time and the program will end with a series of `get` calls.

```python
async def putter(queue):
    for i in range(10):
        await asyncio.sleep(0.5)
        print('put: {}'.format(i))
        await queue.put(i)
    queue.close()


async def getter(queue):
    while True:
        await asyncio.sleep(0.6)
        try:
            print('got: {}'.format(await queue.pop()))
        except QueueClosed:
            break

if __name__ == '__main__':
    queue = AsynchronousQueue()
    loop = asyncio.get_event_loop()
    tasks = [
        asyncio.ensure_future(popper(queue)),
        asyncio.ensure_future(pusher(queue))
    ]
    loop.run_until_complete(asyncio.gather(*tasks))
    loop.close()
```

Running this code gives me the following output:

```
pushing
popping
popped: 0
pushing
popping
popped: 1
pushing
popping
popped: 2
pushing
popping
popped: 3
pushing
pushing
popping
popped: 4
pushing
popping
popped: 5
pushing
popping
popped: 6
pushing
popping
popped: 7
pushing
popping
popped: 8
popping
popped: 9

Process finished with exit code 0
```

We can also re-write the `popper` function using `async for` to achieve the same effect.

```python
async def popper(queue):
    async for item in queue:
        await asyncio.sleep(0.6)
        print('popped: {}'.format(item))
```

[1]: https://www.python.org/dev/peps/pep-3148
[2]: https://www.python.org/dev/peps/pep-0492
[3]: http://stackabuse.com/python-async-await-tutorial
[4]: http://www.snarky.ca/how-the-heck-does-async-await-work-in-python-3-5
