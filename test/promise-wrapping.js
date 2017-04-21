import assert from 'assert';
import fs from 'fs';
import promiser from '../bin/index';

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

    function basicPromise() {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve('foo');
        }, 10);
      });
    }

    promiser()

    .then(state => {
      return state.set('foo', promiser.hook(basicPromise(), (result, next) => {
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
        return promiser.addProp(obj, 'name', basicPromise())
      });
    })

    .then(state => {
      assert.equal(state.foo[0].name, 'bar');
      assert.equal(state.foo[1].name, 'bar');
      assert.equal(state.foo[2].name, 'bar');
      done();
    })

  });

  it('should add properties to objects cooperatively with map', function (done) {
    this.timeout(1000);

    function basicPromise() {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({name: 'baz'});
        }, 10);
      });
    }

    promiser({
      foo: [{}, {}, {}],
      bar: [{}, {}, {}]
    })

    .then(state => {
      return state.forEach('foo', (obj, index) => {
        return promiser.addProp(state.bar[index], 'name', basicPromise())
      }, { map: true });
    })

    .then(state => {
      assert.deepEqual(state.foo[0], {name: 'baz'});
      assert.deepEqual(state.foo[1], {name: 'baz'});
      assert.deepEqual(state.foo[2], {name: 'baz'});
      assert.deepEqual(state.bar[0].name, {name: 'baz'});
      assert.deepEqual(state.bar[1].name, {name: 'baz'});
      assert.deepEqual(state.bar[2].name, {name: 'baz'});
      done();
    })

  })

});
