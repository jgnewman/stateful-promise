import assert from 'assert';
import promiser from '../bin/index';

describe('ES2017', function () {

  it('should resolve properly with async/await', async function () {

    const state = await promiser();
    await state.set('foo', Promise.resolve('bar'));
    await state.set('baz', Promise.resolve('quux'));

    assert.equal(state.foo, 'bar');
    assert.equal(state.baz, 'quux');

  });

  it('should reject properly with async/await', async function () {
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

  it('should combine complex calls properly with async/await', async function () {

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

});
