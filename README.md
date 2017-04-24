# stateful-promise

![Travis-CI](https://travis-ci.org/jgnewman/stateful-promise.svg?branch=master)

#### Now with double the promising power!

Stateful-promise is a wrapper around the native Promise API providing an updatable state available throughout your promise chain as well as many useful methods for simplifying and predictably dealing with promises.

## How it works

Stateful-promise works slightly different from normal promises in that there is a state object which is passed in as the argument to every `then` call. In turn, each `then` call should return a call to a method on the state describing how the state should be manipulated.

## Why this is useful

Even though promises are arguably better than callbacks, sometimes they can still get ugly. Stateful-promise allows you to turn something like this...

```javascript
let inc = 0;

getRecords().then(records => {
  records.forEach(record => {
    doSomethingAsync(record).then(() => {
      inc ++;
      if (inc === records.length) {
        finish(records);
      }
    });
  });
});
```

into this...

```javascript
promiser()
  .then(state => state.set('records', getRecords()))
  .then(state => state.forEach('records', record => doSomethingAsync(record)))
  .then(state => finish(state.records));
```

**Boom**

## Installation

Stateful-promise is available over npm and Yarn. Just a simple one-liner will do it.

```bash
$ yarn add stateful-promise

# or...

$ npm install stateful-promise
```

To use it, just import it.

```javascript
import promiser from 'stateful-promise';
```

Stateful-promise works in both Node.js and the browser but there's a caveat. It assumes the environment it lives in has the `Promise` object available. So it won't work natively with any environment that doesn't implement promises.

**HOWEVER,**

Because it expects a decent Promises A+ implementation to be available, you can install any other Promises A+ library of your choice and tell Stateful-promise to wrap itself around that rather than around the native Promise object.

So, for example, if you needed your app to work in IE11, you could do something like this:

```javascript
import Promise from 'bluebird'; // <- This one is super cool
import promiser from 'stateful-promise';

promiser.use(Promise);
```

## Usage

To create a stateful-promise, you'll need to start with a "promiser". A promiser will create a state object for you and expose chainable `then` and `catch` methods. These work just like native promise methods but the promiser sets them up in such a way that every method in the chain will always receive the state itself as an argument, no matter what a previous method may have returned. For example...

```javascript
promiser({ hello: 'hello', world: 'world' })
  .then(state => console.log(state.hello))
  .then(state => console.log(state.world))
```

Note that if you pass in an object to the `promiser` function, that object will be converted into your state. If you don't, you'll get a nice, empty object instead.

The idea here is, as you go through your chain, you'll manipulate the state by returning calls to state methods that do things like add and update values on the state after other promises have resolved.

To illustrate, let's say you have a function that grabs some records from a database and returns a promise. You'd handle that like this:

```javascript
// Step 1: Create a promiser.
promiser()

// Step 2: Fetch our records and assign the result to a
//         property on the state called "records".
.then(state => {
  return state.set('records', getRecords())
})

// Step 3: Prove that it worked by logging it out.
.then(state => {
  console.log(state.records); // <- [record, record, record, etc...]
})
```

In this example, the `records` property is only set on the state after the `getRecords()` promise resolves. Of course, it might not resolve. If it rejects instead, no `records` property will be created. We can trap that error though, just as you'd expect:

```javascript
promiser()

// In this case, let's assume `failToGetRecords()` rejects.
.then(state => {
  return state.set('records', failToGetRecords())
})

// Because the last function in our chain failed, this one will never
// be executed.
.then(state => {
  console.log(state.records);
})

// Instead, we'll hit our catch block where we can see
// what the error was.
.catch((state, err) => {
  console.log(err);
})
```

Note that `catch` functions are called with the state and a spread of all errors collected. Normally, you'll just have 1 error. But more advanced usage can collect more.

Now let's say we don't really care what the error was. All we really want to do is tell the user their request didn't turn out as they'd hoped. In that case, we can actually _assign_ the error that gets collected.

```javascript
promiser()

// Again we'll assume that `failToGetRecords()` rejects.
// But this time, if it does, we'll deliberately collect 404
// as the error.
.then(state => {
  return state.set('records', failToGetRecords(), 404)
})

.catch((state, err) => {
  sendErrorBackToClient(err); // <- 404
})
```

So those are the basics. Obviously there's a lot of other features that make stateful-promise powerful but you can read about those in the API section. Generally speaking, you use `promiser` to create a state, and for each of your `then` calls, you'll return a method that manipulates the state after some promise resolves.

Normally you'll only need 1 catch block per promise chain but you can chain multiple catch blocks if you need to for those rarer occasions.

## Usage with async/await

The async/await spec is an exciting proposal for the ES2017 JavaScript implementation. If you're wondering whether or not stateful-promise works with async/await, you will be happy to know that it does. Here's a great example of how you would use it:

```javascript
async function doSomething() {

  const state = await promiser();

  await state.set('foo', Promise.resolve('bar'));
  await state.set('baz', Promise.resolve('quux'));

  console.log(state); // <- { foo: 'bar', baz: 'quux' }

}

doSomething();
```

## Usage with Promise.all and Promise.race

Stateful-promise is indeed compatible with `Promise.all` and `Promise.race`. The following examples show how it might work:

**Promise.all**

```javascript
const first = promiser();
const second = promiser();

first.then(state => state.set('foo', Promise.resolve('bar')));
second.then(state => state.set('baz', Promise.resolve('quux')));

Promise.all([first, second]).then([firstState, secondState] => {
  console.log(firstState.foo) // <- 'bar'
  console.log(secondState.baz) // <- 'quux'
});
```

**Promise.race**

```javascript
const first = promiser();
const second = promiser();

first.then(state => state.set('foo', Promise.resolve('bar')));
second.then(state => state.set('baz', Promise.resolve('quux')));

Promise.race([first, second]).then(state => {
  const outcome1 = state.foo && state.foo === 'bar' && 'outcome 1';
  const outcome2 = state.baz && state.baz === 'quux' && 'outcome 2';

  console.log(outcome1 || outcome2) // <- either 'outcome 1' or 'outcome 2'
});
```

## API

### Promiser

#### `promiser([initialState])`

Begins a stateful-promise chain.

- `initialState` {Object} _Optional._ If provided, its values will be assigned to the state before it is passed into any other functions.

Returns a StatefulPromise.

```javascript
promiser({ foo: 'bar' }).then(state => ... )
```

#### `promiser.use(promiseConstructor)`

Configures stateful-promise to use a custom Promise constructor instead of the native `Promise` function. If you're going to use this, you'll want to make sure it gets called _before you do anything else_ with stateful-promise.

- `promiseConstructor` {Function} Must use the Promises A+ implementation.

Returns `undefined`.

```javascript
import Promise from 'bluebird';

promiser.user(Promise);
```

#### `promiser.wrap(fn)`

Wraps a callback-using function such that it can be used as a Promise instead.

- `fn` {Function} Must be a function that utilizes callbacks in the standard Node.js way.

Returns a function that can be used as a replacement for the original function.

```javascript
import fs from 'fs';

const readdir = promiser.wrap(fs.readdir);

readdir('./some/directory').then(files => console.log(files))
```

#### `promiser.hook(promise, hook)`

Works kind of like "promise middleware". Hooks into the resolution of a promise and runs a function when that occurs. Requires you to manually trigger the full resolution of the promise.

- `promise` {Promise} Any native promise.
- `hook` {Function} Takes parameters `result` and `next` where `result` is the result of the promise and `next` is a function that triggers advancement. This parameter is provided in case your hook contains asynchronous actions.

Returns a Promise.

```javascript
promiser.hook(database.getRecords(), (result, next) => {
  console.log(result); // [record, record, record, ...]
  next(); // Trigger the next function in the promise chain.
});
```

#### `promiser.recur(fn)`

Creates a recursive promise.

- `fn` {Function} Takes function parameters `next`, `resolve`, and `reject` where `next` is used to trigger another iteration of the promise, and `resolve` and `reject` respectively resolve and reject the promise, thus ending the iteration cycle.

Returns a Promise.

```javascript
let inc = 0;

promiser.recur((next, resolve, reject) => {
  inc ++;
  if (inc < 3) {
    next();
  } else {
    resolve('it worked!');
  }
})

.then(result => {
  console.log(inc); // <- 3
  console.log(result); // <- it worked!
})
```

### StatefulPromise

#### `StatefulPromise#then(fn)`

Works the same way as `Promise#then` except for two things: First, its argument function will always be called with the state, no matter what was previously returned in the promise chain. Second, in order to keep things chaining the right way, its argument function should return a call to a state method.

- `fn` {Function} Takes `state` as an argument.

Returns a StatefulPromise

```javascript
promiser()

// Always takes `state` as an argument.
.then(state => {

  // Should return a call to a state method.
  return state.set('users', database.getUsers())
})
```

#### `StatefulPromise#catch(fn)`

Works the same way as `Promise#catch` except that its argument function will always be called with the state and a spread of collected errors.

- `fn` {Function} Takes `state` and `...errors` as arguments. These errors appear in chronological order based on when they were collected.

Returns a StatefulPromise

```javascript
promiser()

.then(state => {
  return state.set('foo', new Promise((resolve, reject) => reject('fail')))
})

// Takes the state and a spread of errors.
.catch((state, ...errors) => {
  console.log(errors[0]) // <- 'fail'
})
```

### State

#### `State#toObject([settings])`

Converts the state into a plain object. If `settings` are provided, you can control some things about how that object turns out.

- `settings` {Object} _Optional._ Allows the following keys:
  - `includeErrors` {Boolean} The output will include an `_errors` array of containing the errors currently collected by the state.
  - `exclude` {Array} An array of property names that will be excluded from the resulting object.

Returns an object.

```javascript
promiser({ foo: 'foo', bar: 'bar' })

.then(state => {
  console.log(state.toObject({
    includeErrors: true,
    exclude: ['bar']
  })) // <- { _errors: [], foo: 'foo' }
})
```

Note that this method can also be called on objects other than the state object.

```javascript

.then(state => {

  const original = { foo: 'foo', bar: 'bar' };

  console.log(state.toObject.call(original, {
    exclude: ['foo']
  })) // <- { bar: 'bar' }

})
```

#### `State#toPartialObject(...keys)`

Converts the state into a plain object containing only the specified keys.

- `...keys` {Strings} The names of each key to include in the output.

Returns an object.

```javascript
promiser({
  foo: 'foo',
  bar: 'bar',
  baz: 'baz'
})

.then(state => {
  console.log(state.toPartialObject('foo', 'bar'))
  // { foo: 'foo', bar: 'bar' }
})
```

Note that this method can also be called on objects other than the state object.

```javascript

.then(state => {

  const original = {
    foo: 'foo',
    bar: 'bar',
    baz: 'baz'
  };

  console.log(state.toPartialObject.call(original, 'foo', 'bar'))
  // { foo: 'foo', bar: 'bar' }

})
```

#### `State#set(name, promise [, err])`

Uses a promise to add/modify a property on the state.

- `name` {String} The name of the state property to affect.
- `promise` {Promise} The result of this promise becomes the new property value.
- `err` {Any} _Optional._ If provided, will override the error resulting from a promise rejection.

Returns a Promise that resolves with the state.

```javascript
promiser()

.then(state => {
  return state.set('users', database.getUserRecords(), 404)
})

.then(state => {
  console.log(state.users) // <- [record, record, record]
})

.catch((state, err) => {
  console.log(err) // <- 404
})
```

#### `State#setTo(object, name, promise [, err])`

Uses a promise to add/modify a property on some object, not necessarily the state.

- `object` {Object} The object to affect.
- `name` {String} The name of the object property to affect.
- `promise` {Promise} The result of this promise becomes the new property value.
- `err` {Any} _Optional._ If provided, will override the error resulting from a promise rejection.

Returns a Promise that resolves with the result of the original promise passed in.

```javascript
promiser()

.then(state => {
  return state.set('user', db.getUserById(1))
})

.then(state => {
  console.log(state.user) // <- { id: 1, name: 'Bob' }
  return state.setTo(state.user, 'docs', db.getDocsForUser(state.user.id))
})

.then(state => {
  console.log(state.user) // <- { id: 1, name: 'Bob', docs: [ ... ] }
})
```

#### `State#push(name, promise [, err])`

Uses a promise to push an item to an array on the state.

- `name` {String} The name of the state array to affect.
- `promise` {Promise} The result of this promise becomes the new array value.
- `err` {Any} _Optional._ If provided, will override the error resulting from a promise rejection.

Returns a Promise that resolves with the state.

```javascript
promiser({ foo: [1, 2, 3] })

.then(state => {
  return state.push('foo', new Promise(resolve => resolve(4)))
})

.then(state => {
  console.log(state.foo) // <- [1, 2, 3, 4]
})
```

#### `State#pushTo(array, promise [, err])`

Uses a promise to push an item to an array.

- `array` {Array} The array to affect.
- `promise` {Promise} The result of this promise becomes the new array value.
- `err` {Any} _Optional._ If provided, will override the error resulting from a promise rejection.

Returns a Promise that resolves with the result of the original promise passed in.

```javascript
promiser({ foo: [1, 2, 3] })

.then(state => {
  return state.pushTo(state.foo, new Promise(resolve => resolve(4)))
})

.then(state => {
  console.log(state.foo) // <- [1, 2, 3, 4]
})
```

#### `State#unshift(name, promise [, err])`

Uses a promise to unshift an item to an array on the state.

- `name` {String} The name of the state array to affect.
- `promise` {Promise} The result of this promise becomes the new array value.
- `err` {Any} _Optional._ If provided, will override the error resulting from a promise rejection.

Returns a Promise that resolves with the state.

```javascript
promiser({ foo: [1, 2, 3] })

.then(state => {
  return state.unshift('foo', new Promise(resolve => resolve(0)))
})

.then(state => {
  console.log(state.foo) // <- [0, 1, 2, 3]
})
```

#### `State#unshiftTo(array, promise [, err])`

Uses a promise to unshift an item to an array.

- `array` {Array} The array to affect.
- `promise` {Promise} The result of this promise becomes the new array value.
- `err` {Any} _Optional._ If provided, will override the error resulting from a promise rejection.

Returns a Promise that resolves with the result of the original promise passed in.

```javascript
promiser({ foo: [1, 2, 3] })

.then(state => {
  return state.unshiftTo(state.foo, new Promise(resolve => resolve(0)))
})

.then(state => {
  console.log(state.foo) // <- [0, 1, 2, 3]
})
```

#### `State#forEach(name, iterator [, err])`

Loops over each item in an array property on the state and calls a function for each one. This function takes `item` and `index` as you'd expect but **be careful how you use `index` because this is an asynchronous function** and there is no guarantee that things are actually executing entirely in order.

It is expected that each call to the iterator function will return a Promise. The overarching `forEach` function will resolve once all of the iterator Promises have resolved.

- `name` {String} The name of the array property on the state.
- `iterator` {Function} The function to call for each item in the array.
- `err` {Any} _Optional._ If provided, will override the error resulting from a promise rejection.

_Note that because the whole thing resolves only after all iterations are complete, this method has the potential to collect multiple errors. All of these will be delivered as part of the spread passed to a catch block._

Returns a Promise that resolves with the state.

```javascript
let inc = 0;

promiser({ foo: [1, 2, 3] })

.then(state => {
  return state.forEach('foo', (item, index) => {
    return new Promise(resolve => {
      inc ++;
      resolve();
    })
  })
})

.then(state => {
  console.log(inc) // <- 3
})
```

#### `State#forEachSync(name, iterator [, err, nobail])`

Loops over each item in an array property on the state and calls a function for each one. This function takes `item` and `index` as you'd expect and each iteration runs **only after** the previous iteration has resolved.

It is expected that each call to the iterator function will return a Promise. The overarching `forEachSync` function will resolve once all of the iterator Promises have resolved.

- `name` {String} The name of the array property on the state.
- `iterator` {Function} The function to call for each item in the array.
- `err` {Any} _Optional._ If provided, will override the error resulting from a promise rejection.
- `nobail` {Boolean} _Optional._ If true, the function will not bail out after the first iteration but will instead wait for all iterations to complete before rejecting.

Returns a Promise that resolves with the state.

```javascript
let inc = 0;

promiser({ foo: [1, 2, 3] })

.then(state => {
  return state.forEachSync('foo', (item, index) => {
    return new Promise(resolve => {
      inc ++;
      resolve();
    })
  })
})

.then(state => {
  console.log(inc) // <- 3
})
```

#### `State#map(name, iterator [, err])`

Loops over each item in an array property on the state and calls a function for each one. This function takes `item` and `index` as you'd expect but **be careful how you use `index` because this is an asynchronous function** and there is no guarantee that things are actually executing entirely in order.

It is expected that each call to the iterator function will return a Promise. The result of each of these promises will replace the corresponding value in the array. The overarching `map` function will resolve once all of the iterator Promises have resolved.

- `name` {String} The name of the array property on the state.
- `iterator` {Function} The function to call for each item in the array.
- `err` {Any} _Optional._ If provided, will override the error resulting from a promise rejection.

_Note that because the whole thing resolves only after all iterations are complete, this method has the potential to collect multiple errors. All of these will be delivered as part of the spread passed to a catch block._

_Note that unlike the native `Array#map` method, `State#map` does not return a new array but instead modifies the original array._

Returns a Promise that resolves with the state.

```javascript
promiser({ foo: [1, 2, 3] })

.then(state => {
  return state.map('foo', (item, index) => {
    return new Promise(resolve => {
      resolve(item * 10);
    })
  })
})

.then(state => {
  console.log(state.foo) // <- [10, 20, 30]
})
```

#### `State#mapSync(name, iterator [, err, nobail])`

Loops over each item in an array property on the state and calls a function for each one. This function takes `item` and `index` as you'd expect and each iteration runs **only after** the previous iteration has resolved.

It is expected that each call to the iterator function will return a Promise. The result of each of these promises will replace the corresponding value in the array. The overarching `mapSync` function will resolve once all of the iterator Promises have resolved.

- `name` {String} The name of the array property on the state.
- `iterator` {Function} The function to call for each item in the array.
- `err` {Any} _Optional._ If provided, will override the error resulting from a promise rejection.
- `nobail` {Boolean} _Optional._ If true, the function will not bail out after the first iteration but will instead wait for all iterations to complete before rejecting.

_Note that unlike the native `Array#map` method, `State#mapSync` does not return a new array but instead modifies the original array._

Returns a Promise that resolves with the state.

```javascript
promiser({ foo: [1, 2, 3] })

.then(state => {
  return state.mapSync('foo', (item, index) => {
    return new Promise(resolve => {
      resolve(item * 10);
    })
  })
})

.then(state => {
  console.log(state.foo) // <- [10, 20, 30]
})
```

#### `State#filter(name, iterator [, err])`

Loops over each item in an array property with the purpose of filtering out unneeded items. It calls an iterator function for each item. This function takes `item` and `index` as you'd expect but **be careful how you use `index` because this is an asynchronous function** and there is no guarantee that things are actually executing entirely in order.

It is expected that each call to the iterator function will return a Promise. If the result of one of these promises is truthy, the corresponding array item will be kept. If not, it will be removed. The overarching `filter` function will resolve once all of the iterator Promises have resolved.

- `name` {String} The name of the array property on the state.
- `iterator` {Function} The function to call for each item in the array.
- `err` {Any} _Optional._ If provided, will override the error resulting from a promise rejection.

_Note that because the whole thing resolves only after all iterations are complete, this method has the potential to collect multiple errors. All of these will be delivered as part of the spread passed to a catch block._

_Note that because this function is asynchronous, the resulting filtered array may not be in the same order that the original array was in._

Returns a Promise that resolves with the state.

```javascript
promiser({ foo: [1, 2, 3] })

.then(state => {
  return state.filter('foo', (item, index) => {
    return new Promise(resolve => {
      resolve(item !== 2);
    })
  })
})

.then(state => {
  console.log(state.foo) // <- [1, 3]
})
```

#### `State#filterSync(name, iterator [, err, nobail])`

Loops over each item in an array property with the purpose of filtering out unneeded items. It calls an iterator function for each item. This function takes `item` and `index` as you'd expect and each iteration runs **only after** the previous iteration has resolved.

It is expected that each call to the iterator function will return a Promise. If the result of one of these promises is truthy, the corresponding array item will be kept. If not, it will be removed. The overarching `filterSync` function will resolve once all of the iterator Promises have resolved.

- `name` {String} The name of the array property on the state.
- `iterator` {Function} The function to call for each item in the array.
- `err` {Any} _Optional._ If provided, will override the error resulting from a promise rejection.
- `nobail` {Boolean} _Optional._ If true, the function will not bail out after the first iteration but will instead wait for all iterations to complete before rejecting.

Returns a Promise that resolves with the state.

```javascript
promiser({ foo: [1, 2, 3] })

.then(state => {
  return state.filterSync('foo', (item, index) => {
    return new Promise(resolve => {
      resolve(item !== 2);
    })
  })
})

.then(state => {
  console.log(state.foo) // <- [1, 3]
})
```

#### `State#rejectIf(condition [, err])`

Manually reject a promise chain under some condition.

- `condition` {Boolean} The chain will reject if this boolean is true.
- `err` {Any} _Optional._ The error message passed to the rejection.

Returns a Promise that resolves with the state.

```javascript
promiser({ foo: true })

.then(state => {
  return state.rejectIf(state.foo, 'fail')
})

.catch((state, err) => {
  console.log(err) // <- 'fail'
})
```

#### `State#rejectIfAny(...conditionArrays)`

Manually reject a promise under one of many possible conditions.

- `conditionArrays` {Arrays} Where item 0 is a condition and item 1 is an associated error message.

Returns a Promise that resolves with the state.

```javascript
promiser({ num: 20 })

.then(state => {
  return state.rejectIfAny(
    [state.num > 10, 'too big']
    [state.num < 10, 'too small']
  )
})

.catch((state, err) => {
  console.log(err) // <- 'too big'
})
```

#### `State#handle(promise [, err])`

Allows you to pass a normal promise through in a way that takes full advantage of the system but doesn't take any other actions to manipulate the state. You should use this method when you don't need to make use of the value resolved by the promise.

- `promise` {Promise} The result of this promise is not trapped for you anywhere.
- `err` {Any} _Optional._ If provided, will override the error resulting from a promise rejection.

Returns a Promise that resolves with the state.

```javascript
function prom(value) {
  return new Promise((resolve, reject) => {
    if (value < 100) {
      resolve(value)
    } else {
      reject(value)
    }
  })
}

promiser()

.then(state => {
  return state.handle(prom(1000), 'failed')
})

.catch((state, err) => {
  console.log(err) // <- 'failed'
})
```

## Food for thought

The `map` and `filter` functions (as well as their synchronous counterparts) are convenient and useful but you have to keep in mind what's being "returned" from each of their iterators and make sure you're returning the right thing in order for them to work correctly. This isn't always fully intuitive when we're dealing with promises.

Here's a great example of a mistake that's easy to make:

```javascript
promiser()

// Grab some user records from the database
.then(state => {
  return state.set('users', database.getSomeUsers())
})

// Create a new 'docs' property on each user object as the
// result of fetching all of that user's documents from the database.
.then(state => {
  return state.map('users', user => {
    return state.setTo(user, 'docs', database.getDocsForUser(user.id))
  })
})

// Woops! We ended up turning our users array into an array of docs.
.then(state => {
  console.log(state.users) // <- [[docs], [docs], [docs], etc...]
})
```

This happened because we haven't paid close attention to how the `setTo` function resolves. This function resolves not with the iterator item, but with the result of it's promise argument. Because `map` replaces array items with the result of its iterator calls, we need to make sure those calls are returning the updated `user` object, not the documents array. To fix it, we can do this:

```javascript
// Create a new 'docs' property for each user object as the
// result of fetching all of that user's documents from the database.
.then(state => {
  return state.map('users', user => {
    return state.setTo(user, 'docs', database.getDocsForUser(user.id)).then(() => user);
  })
})
```

Here, we've trapped the resolution of the `setTo` function and re-routed it to return the actual `user` object. In this way, the iterator function will resolve with the updated user object, rather than the "docs" array.

The `filter` function should be handled carefully as well. Here's an example of how to use it correctly:

```javascript
promiser()

// Grab some user records from the database
.then(state => {
  return state.set('users', database.getSomeUsers())
})

// Create a new 'docs' property for each user object as the
// result of fetching all of that user's documents from the database.
// But also filter out any users who don't have documents.
.then(state => {
  return state.filter('users', user => {
    return state.setTo(user, 'docs', database.getDocsForUser(user.id))
                .then(() => !!user.docs.length);
  })
});
```

In this illustration we've skipped over the mistake and shown what needs to happen in order for this function to behave as expected. Because `filter` will keep an array item if its iterator promise resolves truthily and remove the item if it does not, we need to re-route the result of our `setTo` call to return a boolean. This will allow `filter` to determine whether or not to keep the associated item in the array.

If you'd like an easy way to remember how each of the state methods resolves, think of it like this: All state methods resolve with the state _unless_ the name of the method has the suffix "To" (for example `setTo`, `pushTo`, etc). In these cases, the method always resolves with the result of its promise argument.

And that's about it. **Happy promising!**

# Contributing

Stateful-promise runs on Yarn. Just clone it from [the Github repo](https://github.com/jgnewman/stateful-promise), run `$ yarn` to install the development dependencies, and you're ready to go.

The "build" and "test" scripts are described in `package.json` as you'd expect and they use Gulp to put everything together. Source code is in the "src" directory and compiled output is in the "bin" directory.
