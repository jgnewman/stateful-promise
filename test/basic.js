import assert from 'assert';
import promiser from '../bin/index';

describe('Basic Functionality', function () {

  it('should create a StatefulPromise', function () {
    const promise = promiser();
    assert.equal(typeof promise, 'object');
    assert.equal(typeof promise.then, 'function');
    assert.equal(typeof promise.catch, 'function');
  });

  it('should error if you try to provide a bad state', function () {
    try {
      const promise = promiser(4);
    } catch (_) {
      assert.ok(true);
    }
  });

  it('should pass a state into `then`', function (done) {
    const origState = {foo: 'bar'};
    const promise = promiser(origState);
    promise.then(state => {
      assert.equal(state.foo, origState.foo);
      done();
    });
  });

  it('should chain `then` functions when not returning a promise', function (done) {
    const promise = promiser();
    promise
      .then(state => {
        return undefined;
      })
      .then(state => {
        assert.ok(state);
        done();
      });
  });


});
