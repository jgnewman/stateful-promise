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

});
