import assert from 'assert';
import promiser from '../bin/index';
import BluebirdPromise from 'bluebird';

describe('Iterative State Methods', function () {

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

  it('should resolve even when a collection is empty', function (done) {
    let promise = promiser({ foo: [], bar: false });

    promise.then(state => {
      return state.forEach('foo', () => {
        return new Promise(resolce => {
          state.bar = true;
        });
      });
    })
    .then(state => {
      assert.equal(state.bar, false);
      done();
    });
  });

  it('should map a state property synchronously and asynchronously', function (done) {
    const promise = promiser({ foo: [1, 2, 3] });
    let   inc     = 0;

    promise.then(state => {
      return state.map('foo', (num, index) => Promise.resolve(num + 1));
    })
    .then(state => {
      assert.deepEqual(state.foo, [2, 3, 4]);
      return state;
    })
    .then(state => {
      return state.map('foo', (num, index) => Promise.resolve(num + 1));
    })
    .then(state => {
      assert.deepEqual(state.foo, [3, 4, 5]);
      done();
    });
  });

  it('should allow non-promise values returned by iterations', function (done) {
    const promise = promiser({ foo: [1, 2, 3] });
    let   inc     = 0;

    promise.then(state => {
      return state.forEach('foo', (num, index) => {
        return inc ++
      });
    })
    .then(state => {
      assert.equal(inc, 3);
      done();
    });
  });

  it('should collect errors from `forEach`', function (done) {
    const promise = promiser({ foo: [1, 2, 3] });
    promise.then(state => {
      return state.forEach('foo', (num, index) => Promise.reject('fail'));
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
      return state.forEach('foo', ((num, index) => Promise.reject('fail')), 404);
    })
    .catch((state, ...errors) => {
      assert.equal(errors[0], 404);
      done();
    });
  });

  it('should allow early bailing out from `forEachSync`', function (done) {
    const promise = promiser({ foo: [1, 2, 3] });
    promise.then(state => {
      return state.forEachSync('foo', (num, index) => Promise.reject('fail'));
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
      return state.mapSync('foo', (num, index) => Promise.reject('fail'));
    })
    .catch((state, ...errors) => {
      assert.equal(errors.length, 1); // Maybe change this to stop after the first rejection? Maybe as a setting?
      assert.equal(errors[0], 'fail');
      done();
    });
  });

  it('should be able to return something other than state from .map', function (done) {

    promiser({ foo: [{}, {}, {}] })

    .then(state => {
      return state.map('foo', obj => {
        return state.setTo(obj, 'bar', Promise.resolve('baz')).then(() => obj)
      })
    })

    .then(state => {
      assert.deepEqual(state.foo, [{bar: 'baz'}, {bar: 'baz'}, {bar: 'baz'}]);
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

  it('should handle iterations when batching', function (done) {
    this.timeout(1000);

    function timeoutPromise(duration, toResolveWith) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(toResolveWith)
        }, duration)
      })
    }

    promiser({ list: [1, 2, 3], list2: [] })

    .then(state => {
      return state.batch(
        state.forEach('list', item => state.push('list2', timeoutPromise(10 * item, item))),
        state.set('foo', timeoutPromise(10, 'bar'))
      )
    })

    .then(state => {
      assert.equal(state.foo, 'bar');
      assert.deepEqual(state.list2, [1, 2, 3]);
      done();
    })

  });


});
