import assert from 'assert';
import promiser from '../bin/index';
import BluebirdPromise from 'bluebird';

describe('Object Manipulation Methods', function () {

  it('should add properties to objects in promise fashion', function (done) {
    this.timeout(1000);

    promiser({
      foo: [{}, {}, {}]
    })

    .then(state => {
      return state.forEach('foo', obj => {
        return state.setTo(obj, 'name', Promise.resolve('bar'))
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
      return state.setTo(state.foo, 3, Promise.resolve(4))
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
      return state.pushTo(state.foo, Promise.resolve(4))
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
      return state.unshiftTo(state.foo, Promise.resolve(0))
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
      return state.push('foo', Promise.resolve(4))
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
      return state.unshift('foo', Promise.resolve(0))
    })

    .then(state => {
      assert.equal(state.foo[0], 0);
      done();
    })

  });

});
