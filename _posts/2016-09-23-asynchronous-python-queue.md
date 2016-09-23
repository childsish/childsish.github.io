---
layout: post
title: Asynchronous Python Queue
categories: python
---

Futures (PEP 3148 <sup>[1][1]</sup>) and the `async` and `await` keywords (PEP 492 <sup>[2][2]</sup>) are relatively new additions to the Python core language. With them, Python has begun to make asynchronous programming a core part of its appeal. Asynchronous programming is a good choice when certain tasks take a long time to complete, but do not consume much CPU (eg. waiting for a database query or network communication). In such cases, an asynchronous program can continue with other tasks and pick up after previous tasks once they have completed. A word of caution, asynchronous programming is not concurrent programming.

There are plenty of good tutorials on how to use `async` and `await` where the long-running tasks are predefined <sup>[3][3], [4][4]</sup>. However, I couldn't find any tutorials on how to create a delay until a certain condition was met. What I wanted was to create an asynchronous queue with a threshold on the number of entities it could hold. Popping the queue while it was empty should block until new entities were pushed and pushing the queue while it was full should block until existing entities were popped. In addition, there must be a way to close the queue as popping would always be waiting for new input. The key to my solution was to use futures. Using `await` on a `Future` will cause a function to pause until the `Future` has been resolved. This means that a function can create a `Future` and `await` its resolution, which another function can do by calling its `set_result` member. Below is the full solution.

```python
class AsynchronousQueue:
    def __init__(self, threshold=5):
        self.items = deque()
        self.push_future = None
        self.pop_future = None
        self.closed = False

        self.threshold = threshold

    async def push(self, value):
        print('pushing')
        if self.closed:
            raise RuntimeError('Can not push to closed queue.')

        if len(self.items) > self.threshold:
            if self.push_future is None:
                self.push_future = asyncio.Future()
            await self.push_future
        elif self.pop_future is not None:
            self.pop_future.set_result(None)
            self.pop_future = None
        self.items.append(value)

    async def pop(self):
        print('popping')
        if len(self.items) == 0:
            if self.closed:
                raise RuntimeError('Can not pop from closed, empty queue.')
            if self.pop_future is None:
                self.pop_future = asyncio.Future()
            await self.pop_future
        elif self.push_future is not None:
            self.push_future.set_result(None)
            self.push_future = None
        return self.items.popleft()

    def close(self):
        self.closed = True

    def can_push(self):
        return not self.closed

    def can_pop(self):
        return len(self.items) > 0 or not self.closed
```

To run the code, I wrote asynchronous `pusher` and `popper` functions that would `push` and `pop` entities from the queue every 0.5 and 0.6 seconds, respectively. This should mean that the queue will slowly fill over time and the program will end with a series of `pop` calls.

```python
async def pusher(queue):
    for i in range(10):
        await asyncio.sleep(0.5)
        await queue.push(i)
    queue.close()


async def popper(queue):
    while queue.can_pop():
        await asyncio.sleep(0.6)
        print('popped: {}'.format(await queue.pop()))

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

I'm satisfied with this solution, but it's my first attempt, so I'm sure there are better ways to do this.

[1]: https://www.python.org/dev/peps/pep-3148
[2]: https://www.python.org/dev/peps/pep-0492
[3]: http://stackabuse.com/python-async-await-tutorial
[4]: http://www.snarky.ca/how-the-heck-does-async-await-work-in-python-3-5
