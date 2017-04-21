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

  it('should chain `then` functions when state is returned', function (done) {
    const promise = promiser();
    promise
      .then(state => {
        return state;
      })
      .then(state => {
        assert.ok(state);
        done();
      });
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
      return state.forEachSync('foo', (num, index) => {
        return new Promise(resolve => {
          resolve(num + 1);
        });
      }, { map: true });
    })
    .then(state => {
      assert.deepEqual(state.foo, [2, 3, 4]);
      return state;
    })
    .then(state => {
      return state.forEach('foo', (num, index) => {
        return new Promise(resolve => {
          resolve(num + 1);
        });
      }, { map: true });
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
      assert.equal(errors.length, 3); // Maybe change this to stop after the first rejection? Maybe as a setting?
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
      }, { err: 404 });
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
      }, { bail: true });
    })
    .catch((state, ...errors) => {
      assert.equal(errors.length, 1); // Maybe change this to stop after the first rejection? Maybe as a setting?
      assert.equal(errors[0], 'fail');
      done();
    });
  });



});
