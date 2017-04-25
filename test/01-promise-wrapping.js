import assert from 'assert';
import fs from 'fs';
import promiser from '../bin/index';
import BluebirdPromise from 'bluebird';

describe('Promise Wrapping', function () {

  it('should wrap a callback-based function to use promises', function (done) {

    this.timeout(1000);

    function normalcb(cb) {
      setTimeout(() => {
        cb(null, 'success');
      }, 10);
    }

    promiser()
    .then(state => {
      return state.set('success', promiser.wrap(normalcb)());
    })
    .then(state => {
      assert.equal(state.success, 'success');
      done();
    });

  });

  it('should reject properly when wrapping a callback-based function as well', function (done) {
    this.timeout(1000);

    let shouldBeTrue = true;

    function normalcb(cb) {
      setTimeout(() => {
        cb('fail');
      }, 10);
    }

    promiser()
    .then(state => {
      return state.set('success', promiser.wrap(normalcb)());
    })
    .then(state => {
      shouldBeTrue = false;
    })
    .catch((state, ...errors) => {
      assert.equal(shouldBeTrue, true);
      assert.equal(errors[0], 'fail');
      done();
    });
  });

  it('should properly wrap a native callback-based function', function (done) {

    const wrapped = promiser.wrap(fs.readdir);

    promiser()
    .then(state => {
      return state.set('files', wrapped(__dirname))
    })
    .then(state => {
      assert.ok(state.files.length);
      done();
    })

  });

  it('should allow hooking into promises', function (done) {
    this.timeout(1000);

    let shouldBeFoo = null;

    promiser()

    .then(state => {
      return state.set('foo', promiser.hook(Promise.resolve('foo'), (result, next) => {
        shouldBeFoo = result;
        next();
      }));
    })

    .then(state => {
      assert.equal(state.foo, 'foo');
      assert.equal(shouldBeFoo, 'foo');
      done();
    })
  });

  it('should create a recursive promise', function (done) {
    this.timeout(1000);

    let inc = 0;

    promiser()

    .then(state => {
      return state.set('foo', promiser.recur((next, resolve, reject) => {
        setTimeout(() => {
          inc ++;
          if (inc > 2) {
            resolve('foo');
          } else {
            next();
          }
        }, 10)
      }))
    })

    .then(state => {
      assert.equal(inc, 3);
      assert.equal(state.foo, 'foo');
      done();
    })

  });

  it('should work with other promise engines', function (done) {
    promiser.use(BluebirdPromise);

    const wrapped = promiser.wrap(fs.readdir);

    promiser()
    .then(state => {
      return state.set('files', wrapped(__dirname))
    })
    .then(state => {
      assert.ok(state.files.length);
      promiser.use(Promise);
      done();
    })

  });

});
