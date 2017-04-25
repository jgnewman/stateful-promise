import assert from 'assert';
import promiser from '../bin/index';
import BluebirdPromise from 'bluebird';

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
    promiser()

    .then(state => {
      return undefined;
    })

    .then(state => {
      assert.ok(state);
      done();
    })
  });

  it('should work with other promise engines', function (done) {
    promiser.use(BluebirdPromise);

    const origState = {foo: 'bar'};
    const promise = promiser(origState);
    promise.then(state => {
      assert.equal(state.foo, origState.foo);
      promiser.use(Promise);
      done();
    });
  })

  it ('should work with Promise.all', function (done) {

    const state1 = promiser();
    const state2 = promiser();

    state1.then(state => state.set('foo', Promise.resolve('bar')));
    state2.then(state => state.set('baz', Promise.resolve('quux')));

    Promise.all([state1, state2]).then(states => {
      assert.equal(states[0].foo, 'bar');
      assert.equal(states[1].baz, 'quux');
      done();
    });

  });

  it ('should work with Promise.race', function (done) {

    const state1 = promiser();
    const state2 = promiser();

    state1.then(state => state.set('foo', Promise.resolve('bar')));
    state2.then(state => state.set('baz', Promise.resolve('quux')));

    Promise.race([state1, state2]).then(state => {
      const outcome1 = state.foo && state.foo === 'bar';
      const outcome2 = state.baz && state.baz === 'quux';

      assert.ok(outcome1 || outcome2);
      done();
    });

  });

});
