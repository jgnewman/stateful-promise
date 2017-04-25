import assert from 'assert';
import promiser from '../bin/index';

describe('ES2017', function () {

  it('should resolve properly', async function () {

    const state = await promiser();
    await state.set('foo', Promise.resolve('bar'));
    await state.set('baz', Promise.resolve('quux'));

    assert.equal(state.foo, 'bar');
    assert.equal(state.baz, 'quux');

  });

  it('should reject properly', async function () {
    let shouldBeFalse = false;
    let errors;

    const state = await promiser()

    try {

      await state.set('a', Promise.resolve(1))
      await state.set('b', Promise.resolve(2))
      await state.set('c', Promise.reject(3))
      await state.set('d', Promise.resolve(4))

      shouldBeFalse = true;

    } catch (err) {
      errors = err;
    }

    assert.equal(shouldBeFalse, false);
    assert.deepEqual(errors, {state: state, errors: [3]});

    assert.equal(state.a, 1);
    assert.equal(state.b, 2);
    assert.equal(state.c, undefined);
    assert.equal(state.d, undefined);

  });

  it('should combine complex calls properly', async function () {

    let vals = [1, 100, 1];

    function prom() {
      return new Promise(resolve => {
        const val = vals.shift();
        resolve(val);
      })
    }

    const state = await promiser({ foo: [{}, {}, {}] })

    await state.filter('foo', obj => {
      return state.setTo(obj, 'bar', prom()).then(result => result < 10)
    });

    assert.deepEqual(state.foo, [{bar: 1}, {bar: 1}]);

  });

  it('should reject properly with complex calls as well', async function () {

    let vals = [1, 100, 1];
    let rejected = false;

    function prom() {
      return new Promise((resolve, reject) => {
        const val = vals.shift();
        reject(val);
      })
    }

    const state = await promiser({ foo: [{}, {}, {}] })

    try {

      await state.filterSync('foo', obj => {
        return state.setTo(obj, 'bar', prom()).then(result => result < 10)
      });

    } catch (err) {
      rejected = true;
    }

    assert.ok(rejected);
    assert.deepEqual(state._errors, [1, 100, 1]);

  });

  it('should handle manual rejections properly', async function () {
    let didReject = false;
    let errors;

    try {
      const state = await promiser()
      await state.rejectIf(!state.foo, 404)
    } catch (e) {
      didReject = true;
      errors = e.errors;
    }

    assert.ok(didReject)
    assert.deepEqual(errors, [404])

  })

});
