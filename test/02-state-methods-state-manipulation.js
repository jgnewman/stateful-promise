import assert from 'assert';
import promiser from '../bin/index';
import BluebirdPromise from 'bluebird';

describe('Basic State Manipulation Methods', function () {

  it('should statify normal promises', function (done) {
    this.timeout(1000);

    let initialState;

    promiser()

    .then(state => {
      initialState = state;
      return state.handle(Promise.resolve('foo'));
    })

    .then(state => {
      assert.equal(state, initialState);
      done();
    })

  });

  it('should collect errors when statifying normal promises', function (done) {
    this.timeout(1000);

    let initialState;
    let shouldNotBeTrue = false;

    promiser()

    .then(state => {
      initialState = state;
      return state.handle(Promise.reject('foo'), 'bar');
    })

    .then(state => {
      shouldNotBeTrue = true;
    })

    .catch((state, err) => {
      assert.equal(shouldNotBeTrue, false);
      assert.equal(err, 'bar');
      done();
    })

  });

  it('should `handle` non-promise values', function (done) {
    this.timeout(1000);

    let initialState;

    promiser()

    .then(state => {
      initialState = state;
      return state.handle('foo');
    })

    .then(state => {
      assert.equal(state, initialState);
      done();
    })

  });

  it('should add a property to the state', function (done) {
    const promise = promiser();
    promise.then(state => {
      return state.set('foo', Promise.resolve('bar'));
    })
    .then(state => {
      assert.equal(state.foo, 'bar');
      done();
    });
  });

  it('should update a property on the state', function (done) {
    const promise = promiser({ foo: 'bar' });
    promise.then(state => {
      return state.set('foo', Promise.resolve('baz'));
    })
    .then(state => {
      assert.equal(state.foo, 'baz');
      done();
    });
  });

  it('should not have problems with the asynchronous nature of promises', function (done) {
    this.timeout(1000);
    const promise = promiser();
    promise.then(state => {
      return state.set('foo', new Promise(resolve => {
        setTimeout(() => {
          resolve('bar');
        }, 200)
      }));
    })
    .then(state => {
      assert.equal(state.foo, 'bar');
      done();
    });
  });

  it('should collect errors and pass them to a `catch` block', function (done) {
    const promise = promiser();
    promise.then(state => {
      return state.set('foo', Promise.reject('fail'));
    })
    .catch((state, ...errors) => {
      assert.equal(typeof state, 'object');
      assert.equal(errors[0], 'fail');
      done();
    });
  });

  it('should chain `catch` blocks', function (done) {
    const promise = promiser();
    let   firstCatchCalled = false;

    promise.then(state => {
      return state.set('foo', Promise.reject('fail'));
    })
    .catch(state => {
      firstCatchCalled = true;
      return state;
    })
    .catch((state, ...errors) => {
      assert.ok(firstCatchCalled);
      assert.equal(errors[0], 'fail');
      done();
    });
  });

  it('should skip `then` blocks that fall after a rejection', function (done) {
    const promise = promiser();
    let   inc     = 0;

    promise.then(state => {
      inc ++;
      return state;
    })
    .then(state => {
      return state.set('foo', new Promise((resolve, reject) => {
        inc ++;
        reject('fail');
      }));
    })
    .then(state => {
      // Should not be called
      inc ++;
      return state;
    })
    .catch((state, ...errors) => {
      assert.equal(inc, 2);
      done();
    });
  });

  it('should should not matter where in the chain a `catch` block falls', function (done) {
    const promise = promiser();
    let   inc     = 0;

    promise.then(state => {
      // should be called
      inc ++;
      return state;
    })
    .catch((state, ...errors) => {
      assert.equal(inc, 2);
      done();
    })
    .then(state => {
      return state.set('foo', new Promise((resolve, reject) => {
        // should be called
        inc ++;
        reject('fail');
      }));
    })
    .then(state => {
      // Should not be called
      inc ++;
      return state;
    });
  });

  it('should override errors when told', function (done) {
    const promise = promiser();
    promise.then(state => {
      return state.set('foo', Promise.reject('fail'), 404);
    })
    .catch((state, ...errors) => {
      assert.equal(errors[0], 404);
      done();
    });
  });

  it('should allow manual rejections by condition', function (done) {
    const promise = promiser();
    let   shouldNotBeTrue = false;

    promise.then(state => {
      return state.rejectIf(true, 'fail');
    })
    .then(state => {
      shouldNotBeTrue = true;
    })
    .catch((state, err) => {
      assert.equal(err, 'fail');
      assert.equal(shouldNotBeTrue, false);
      done();
    })
  });

  it('should allow manual rejections by any of multiple conditions', function (done) {
    const promise = promiser();
    let   shouldNotBeTrue = false;

    promise.then(state => {
      return state.rejectIfAny([false, 1], [false, 2], [true,  3]);
    })
    .then(state => {
      shouldNotBeTrue = true;
    })
    .catch((state, err) => {
      assert.equal(err, 3);
      assert.equal(shouldNotBeTrue, false);
      done();
    })
  });

  it('should allow manual rejections by all of multiple conditions', function (done) {
    const promise = promiser();
    let   shouldNotBeTrue = true;

    promise
    .then(state => {
      return state.rejectIfAll([true, true, false], 'error1');
    })
    .then(state => {
      shouldNotBeTrue = false;
    })
    .then(state => {
      return state.rejectIfAll([true, true, true], 'error2');
    })
    .then(state => {
      shouldNotBeTrue = true;
    })
    .catch((state, err) => {
      assert.equal(err, 'error2');
      assert.equal(shouldNotBeTrue, false);
      done();
    })
  });

  it('should convert the state to an object', function (done) {
    const initial = { foo: 'bar' };

    promiser(initial)

    .then(state => {
      const obj = state.toObject();
      assert.deepEqual(obj, initial);
      done();
    })
  });

  it('should convert the state to an object and include errors', function (done) {
    const initial = { foo: 'bar' };

    promiser(initial)

    .then(state => {
      const obj = state.toObject({ includeErrors: true });
      assert.ok(Array.isArray(obj._errors));
      done();
    })
  });

  it('should convert the state to an object and exclude properties', function (done) {
    const initial = { foo: 'bar', baz: 'quux' };

    promiser(initial)

    .then(state => {
      const obj = state.toObject({ exclude: ['foo'] });
      assert.ok(Object.keys(obj).length === 1);
      assert.equal(obj.baz, 'quux');
      done();
    })
  });

  it('should call `toObject` on other objects as well', function (done) {
    const initial = { foo: 'bar', baz: 'quux' };

    promiser()

    .then(state => {
      const obj = state.toObject.call(initial, { exclude: ['foo'] });
      assert.ok(Object.keys(obj).length === 1);
      assert.equal(obj.baz, 'quux');
      done();
    })
  });

  it('should convert only part of the state to an object', function (done) {
    const initial = { a: 1, b: 2, c: 3, d: 4 };

    promiser(initial)

    .then(state => {
      const obj = state.toPartialObject('b', 'c');
      assert.ok(!obj.a);
      assert.ok(!obj.d);
      assert.equal(obj.b, 2);
      assert.equal(obj.c, 3);
      done();
    })
  });

  it('should work with other promise engines', function (done) {
    promiser.use(BluebirdPromise);

    const promise = promiser();
    let   shouldNotBeTrue = false;

    promise.then(state => {
      return state.rejectIf(true, 'fail');
    })
    .then(state => {
      shouldNotBeTrue = true;
    })
    .catch((state, err) => {
      assert.equal(err, 'fail');
      assert.equal(shouldNotBeTrue, false);
      promiser.use(Promise);
      done();
    })

  });

  it('should concurrently batch state method promises', function (done) {
    this.timeout(1000);

    function timeoutPromise(duration, toResolveWith) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(toResolveWith)
        }, duration)
      })
    }

    promiser()

    .then(state => {
      return state.batch(
        state.set('foo', timeoutPromise(20, 'bar')),
        state.set('baz', timeoutPromise(10, 'quux'))
      )
    })

    .then(state => {
      assert.equal(state.foo, 'bar');
      assert.equal(state.baz, 'quux');
      done();
    })

  });

  it('should collect errors properly when batching', function (done) {
    this.timeout(1000);

    function timeoutPromise(duration, toRejectWith) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(toRejectWith)
        }, duration)
      })
    }

    promiser()

    .then(state => {
      return state.batch(
        state.set('foo', timeoutPromise(20, 'fail1')),
        state.set('baz', timeoutPromise(10, 'fail2'))
      )
    })

    .catch((state, err) => {
      assert.deepEqual(state._errors, ['fail2', 'fail1']);
      done();
    })

  });


});
