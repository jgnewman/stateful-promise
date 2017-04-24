import assert from 'assert';
import promiser from '../bin/index';
import BluebirdPromise from 'bluebird';

describe('State Methods', function () {

  it('should statify normal promises', function (done) {
    this.timeout(1000);

    let initialState;

    function prom() {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve('foo');
        }, 10)
      })
    }

    promiser()

    .then(state => {
      initialState = state;
      return state.handle(prom());
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

    function prom() {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          reject('foo');
        }, 10)
      })
    }

    promiser()

    .then(state => {
      initialState = state;
      return state.handle(prom(), 'bar');
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

  it('should add a property to the state', function (done) {
    const promise = promiser();
    promise.then(state => {
      return state.set('foo', new Promise(resolve => {
        resolve('bar');
      }));
    })
    .then(state => {
      assert.equal(state.foo, 'bar');
      done();
    });
  });

  it('should update a property on the state', function (done) {
    const promise = promiser({ foo: 'bar' });
    promise.then(state => {
      return state.set('foo', new Promise(resolve => {
        resolve('baz');
      }));
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
        }, 10)
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
      return state.set('foo', new Promise((resolve, reject) => {
        reject('fail');
      }));
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
      return state.set('foo', new Promise((resolve, reject) => {
        reject('fail');
      }));
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
      return state.set('foo', new Promise((resolve, reject) => {
        reject('fail');
      }), 404);
    })
    .catch((state, ...errors) => {
      assert.equal(errors[0], 404);
      done();
    });
  });

  it('should iterate over a state property synchronously', function (done) {
    this.timeout(1000);

    const promise = promiser({ foo: [1, 2, 3] });
    let   inc     = 0;

    promise.then(state => {
      return state.forEachSync('foo', (num, index) => {
        return new Promise(resolve => {
          setTimeout(() => {
            inc ++;
            resolve();
          }, 10);
        });
      });
    })
    .then(state => {
      assert.equal(inc, 3);
      done();
    });
  });

  it('should iterate over a state property asynchronously', function (done) {
    const promise = promiser({ foo: [1, 2, 3] });
    let   inc     = 0;

    promise.then(state => {
      return state.forEach('foo', (num, index) => {
        return new Promise(resolve => {
          setTimeout(() => {
            inc ++;
            resolve();
          }, 10);
        });
      });
    })
    .then(state => {
      assert.equal(inc, 3);
      done();
    });
  });

  it('should map a state property synchronously and asynchronously', function (done) {
    const promise = promiser({ foo: [1, 2, 3] });
    let   inc     = 0;

    promise.then(state => {
      return state.map('foo', (num, index) => {
        return new Promise(resolve => {
          resolve(num + 1);
        });
      });
    })
    .then(state => {
      assert.deepEqual(state.foo, [2, 3, 4]);
      return state;
    })
    .then(state => {
      return state.map('foo', (num, index) => {
        return new Promise(resolve => {
          resolve(num + 1);
        });
      });
    })
    .then(state => {
      assert.deepEqual(state.foo, [3, 4, 5]);
      done();
    });
  });

  it('should collect errors from `forEach`', function (done) {
    const promise = promiser({ foo: [1, 2, 3] });
    promise.then(state => {
      return state.forEach('foo', (num, index) => {
        return new Promise((resolve, reject) => {
          reject('fail');
        });
      });
    })
    .catch((state, ...errors) => {
      assert.equal(errors.length, 3);
      assert.equal(errors[0], 'fail');
      done();
    });
  });

  it('should override errors from `forEach`', function (done) {
    const promise = promiser({ foo: [1, 2, 3] });
    promise.then(state => {
      return state.forEach('foo', (num, index) => {
        return new Promise((resolve, reject) => {
          reject('fail');
        });
      }, 404);
    })
    .catch((state, ...errors) => {
      assert.equal(errors[0], 404);
      done();
    });
  });

  it('should allow early bailing out from `forEachSync`', function (done) {
    const promise = promiser({ foo: [1, 2, 3] });
    promise.then(state => {
      return state.forEachSync('foo', (num, index) => {
        return new Promise((resolve, reject) => {
          reject('fail');
        });
      });
    })
    .catch((state, ...errors) => {
      assert.equal(errors.length, 1); // Maybe change this to stop after the first rejection? Maybe as a setting?
      assert.equal(errors[0], 'fail');
      done();
    });
  });

  it('should allow early bailing out from `mapSync`', function (done) {
    const promise = promiser({ foo: [1, 2, 3] });
    promise.then(state => {
      return state.mapSync('foo', (num, index) => {
        return new Promise((resolve, reject) => {
          reject('fail');
        });
      });
    })
    .catch((state, ...errors) => {
      assert.equal(errors.length, 1); // Maybe change this to stop after the first rejection? Maybe as a setting?
      assert.equal(errors[0], 'fail');
      done();
    });
  });

  it('should be able to return something other than state from .map', function (done) {

    function prom() {
      return new Promise(resolve => {
        resolve('baz');
      })
    }

    promiser({ foo: [{}, {}, {}] })

    .then(state => {
      return state.map('foo', obj => {
        return state.setTo(obj, 'bar', prom()).then(() => obj)
      })
    })

    .then(state => {
      assert.deepEqual(state.foo, [{bar: 'baz'}, {bar: 'baz'}, {bar: 'baz'}]);
      done();
    })

  });

  it('should add properties to objects in promise fashion', function (done) {
    this.timeout(1000);

    function basicPromise() {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve('bar');
        }, 10);
      });
    }

    promiser({
      foo: [{}, {}, {}]
    })

    .then(state => {
      return state.forEach('foo', obj => {
        return state.setTo(obj, 'name', basicPromise())
      });
    })

    .then(state => {
      assert.equal(state.foo[0].name, 'bar');
      assert.equal(state.foo[1].name, 'bar');
      assert.equal(state.foo[2].name, 'bar');
      done();
    })

  });

  it('should add properties to top-level state objects too', function (done) {

    promiser({
      foo: [1, 2, 3]
    })

    .then(state => {
      return state.setTo(state.foo, 3, new Promise(resolve => resolve(4)))
    })

    .then(state => {
      assert.equal(state.foo.length, 4);
      assert.equal(state.foo[3], 4);
      done();
    })

  });

  it('should push an item to an array', function (done) {

    promiser({
      foo: [1, 2, 3]
    })

    .then(state => {
      return state.pushTo(state.foo, new Promise(resolve => resolve(4)))
    })

    .then(state => {
      assert.equal(state.foo[3], 4);
      done();
    })

  });

  it('should unshift an item to an array', function (done) {

    promiser({
      foo: [1, 2, 3]
    })

    .then(state => {
      return state.unshiftTo(state.foo, new Promise(resolve => resolve(0)))
    })

    .then(state => {
      assert.equal(state.foo[0], 0);
      done();
    })

  });

  it('should push an item to a state array', function (done) {

    promiser({
      foo: [1, 2, 3]
    })

    .then(state => {
      return state.push('foo', new Promise(resolve => resolve(4)))
    })

    .then(state => {
      assert.equal(state.foo[3], 4);
      done();
    })

  });

  it('should unshift an item to a state array', function (done) {

    promiser({
      foo: [1, 2, 3]
    })

    .then(state => {
      return state.unshift('foo', new Promise(resolve => resolve(0)))
    })

    .then(state => {
      assert.equal(state.foo[0], 0);
      done();
    })

  });

  it('should filter an array', function (done) {

    let vals = [1, 100, 1];

    function prom() {
      return new Promise(resolve => {
        const val = vals.shift();
        resolve(val);
      })
    }

    promiser({ foo: [{}, {}, {}] })

    .then(state => {
      return state.filter('foo', obj => {
        return state.setTo(obj, 'bar', prom()).then(result => result < 10)
      })
    })

    .then(state => {
      assert.deepEqual(state.foo, [{bar: 1}, {bar: 1}]);
      done();
    })

  });

  it('should synchrounouly filter an array', function (done) {

    let vals = [1, 100, 1];

    function prom() {
      return new Promise(resolve => {
        const val = vals.shift();
        resolve(val);
      })
    }

    promiser({ foo: [{}, {}, {}] })

    .then(state => {
      return state.filterSync('foo', obj => {
        return state.setTo(obj, 'bar', prom()).then(result => result < 10)
      })
    })

    .then(state => {
      assert.deepEqual(state.foo, [{bar: 1}, {bar: 1}]);
      done();
    })

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

  it('should allow manual rejections by multiple conditions', function (done) {
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

});
