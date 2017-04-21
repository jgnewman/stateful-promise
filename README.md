# stateful-promise

#### Never let promises get confusing again!

Stateful-promise is a light wrapper around the native Promise implementation providing an updatable state available throughout the promise chain as well as useful iterative promise-based methods.

## How it works

Stateful-promise works slightly different from normal promises in that you begin with a state object which is passed in as the argument to every `.then` call. In turn, each `.then` call should return a call to a method on the state describing how the state should be manipulated.

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

## Usage

Start by importing the module:

```javascript
import promiser from 'stateful-promise';
```

Next, create a stateful promise:

```javascript
const promise = promiser();
```

Optionally, you can pass in some initial state values here if you want.

```javascript
const promise = promiser({ foo: 'bar' });
```

This function will take the object you pass in and convert it into an instance of a `State` object. The `State` object will then be passed to _every_ instance of `.then` and `.catch` in your promise chain. This way, it acts as a collector of all of the values your promise chain creates. But it's methods are the real secret sauce of stateful promises.

Next, we'll likely want to add a value to the state. A good example would be if we were going to read some User records from a database and then do something with them after we received them.

```javascript
promiser()
  .then(state => {
    return state.set('users', db.getUsers({ where: { name: 'John' } }))
  })
  .then(state => {
    console.log(state.users); // We now have an array of user records.
  })
```

The important thing here is that `db.getUsers` returns a promise.

The `set` function will add a new property to the state or modify an existing one by the same name. Its first argument is the name of the state property to affect and its second argument should be a regular old promise instance. Whatever value is resolved by that promise will become the new value on the state.

Now let's do an asynchronous iteration on that users array.

```javascript
promiser()
  .then(state => {
    return state.set('users', db.getUsers({ where: { name: 'John' } }))
  })
  .then(state => {
    return state.forEach('users', user => {
      return db.updateUser(user.id, { name: 'Bill' })
    })
  })
  .then(state => {
    console.log('Finished iterating!');
  })
```

In this case, each execution of our iterator function needs to return a promise as well. If so, we won't move on to our next `then` call until all of the iterations have either resolved or rejected (which we'll get to in a moment).

And, if it so happens that we don't want to asynchronously iterate over each item but would rather have each iteration wait until the previous one finishes before executing, we can use `state.forEachSync` instead of `state.forEach`. It functions the same way.

This is all well and good, but we may want to actually modify the users array on the state after updating each record as well. To do that, we'll pass in an extra parameter to `forEach`:

```javascript
promiser()
  .then(state => {
    return state.set('users', db.getUsers({ where: { name: 'John' } }))
  })
  .then(state => {
    // state.users === [{name: 'John'}, {name: 'John'}, etc...]
    return state.forEach('users', user => {
      return db.updateUser(user.id, { name: 'Bill' })
    }, { map: true }) // <- Allows updating the original array.
  })
  .then(state => {
    // state.users === [{name: 'Bill'}, {name: 'Bill'}, etc...]
    console.log('Finished iterating!');
  })
```

As you might have guessed, setting `map: true` causes our `.forEach` function to behave more like a `.map` function wherein the items in the original array are replaced by the results of each promise resolution.

Now let's talk about rejection.

Here's a basic example of how you can handle rejected promises:

```javascript
promiser()
  .then(state => {
    return newPromise((resolve, reject) => reject('failed'))
  })
  .catch((state, ...errors) => {
    console.log(errors[0]) // <- 'failed'
  })
```

In this case we have a single `catch` block. It will never be executed unless a promise in the chain is rejected somewhere. At that point, stateful-promise will stop executing `then` calls and start executing `catch` calls. For each `catch` block you've created, you'll get access to the state as well as all errors that have been collected in the execution chain.

Why would multiple errors be collected, you ask? Because `forEach` and `forEach` sync will finish all of their iterations, even if rejections are occurring. You can get `forEachSync` to bail out after the first rejection by using the `{bail: true}` option.

Naturally, it doesn't matter where in the chain your `catch` blocks fall, or how many of them you have. Calls to `then` and `catch` work very much like normal promises.
