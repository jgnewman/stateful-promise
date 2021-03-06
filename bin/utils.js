'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createNativePromise = createNativePromise;
exports.assignPromiseEngine = assignPromiseEngine;
exports.fixAsyncAwait = fixAsyncAwait;
exports.executeChain = executeChain;
exports.statifyPromise = statifyPromise;
exports.promiseIteration = promiseIteration;
exports.promiseIterationSync = promiseIterationSync;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NativePromise = void 0;

// We're going to let users determine the native Promise engine for
// environments that don't yet support promises.
if (typeof Promise !== 'undefined') {
  NativePromise = Promise;
}

/**
 * Allows us to create a Promise making sure that we're using
 * the native Promise engine.
 *
 * @param  {Function} fn Takes `resolve` and `reject`.
 *
 * @return {Promise}
 */
function createNativePromise(fn) {
  return new NativePromise(fn);
}

/**
 * Allows the user to asign the native Promise engine.
 */
function assignPromiseEngine(engine) {
  NativePromise = engine;
}

/**
 * A quick class for building AsyncErrors that help us
 * deal with async/await compatibility.
 */

var AsyncError = function AsyncError(state) {
  _classCallCheck(this, AsyncError);

  this.err = state._errors[0];
  this.state = state;
  this.errors = state._errors;
  this.statefulPromise = true;
};

/**
 * Hooks into the resolution of each state method to take advantage
 * of async/await error handling. Without this function, async/await
 * won't catch any errors because they're internally handled by this system.
 *
 * If there are errors in the error collector and no registered catch blocks,
 * we'll trigger a rejection that won't be caught by the system. This will
 * allow async/await to catch the error if we're in that environment and, if not,
 * it'll trigger an error the user should know about.
 *
 * @param  {State}   state     A State instance.
 * @param  {Any}     toReturn  The value resolved by the state method.
 *
 * @return {Promise}           Either a direct rejection or a resolution.
 */


function fixAsyncAwait(state, toReturn) {
  var promiser = state._promiser;
  if (state._errors.length && !promiser.catchers.length) {
    return NativePromise.reject(new AsyncError(state));
  } else {
    return NativePromise.resolve(toReturn);
  }
}

/**
 * Executes a function from a queue. Normally that function will return a
 * promise. If so, we expect the promise to resolve because it has been
 * created using an always-resolving State method. Once it resolves, we check
 * to see if any errors have been collected. If not, we recurse on to the next
 * function in the queue. If so, abandon the normal queue and start the process
 * over again on the error catchers queue.
 *
 * If at any time a function does not return a promise, the iteration ceases.
 *
 * @param  {StatefulPromise} statefulPromise  Should contain a queue and a catchers property.
 * @param  {Array}           queue            A list of functions.
 * @param  {Boolean}         queueIsCatchers  Tracks whether we've moved on to the catchers queue.
 *
 * @return {undefined}
 */
function executeChain(statefulPromise, queue, queueIsCatchers) {
  if (queue.length) {
    var maybePromise = queue[0]();

    var next = function next() {
      if (queueIsCatchers || !statefulPromise.state._errors.length) {
        return executeChain(statefulPromise, queue.slice(1), queueIsCatchers);
      } else {
        return executeChain(statefulPromise, statefulPromise.catchers, true);
      }
    };

    // If we returned a promise, keep iterating after resolution.
    if (maybePromise && maybePromise.then) {
      maybePromise.then(function () {
        return next();
      });

      // If we returned the state, keep iterating immediately.
    } else {
      return next();
    }
  }
}

/**
 * Traps the process of a normal promise and returns a new promise instead
 * that will always resolve with a state but will store any errors in the
 * state's errors array.
 *
 * StatefulPromise chains should return one of these types of promises
 * from every `then` block.
 *
 * @param  {State}    state        An instance of a State object.
 * @param  {Promise}  promise      An instance of a Promise object.
 * @param  {Any}      err          An error used to override the error thrown by a promise rejection.
 * @param  {Function} resolveHook  Optional. An action to run when the original promise reolves.
 *
 * @return {Promise} Always resolves with the `state` argument.
 */
function statifyPromise(state, promise, err, resolveHook) {
  return createNativePromise(function (resolve) {
    var didResolve = false;
    var resolveWith = void 0;

    var next = function next() {
      if (!didResolve) {
        didResolve = true;
        resolve(resolveWith || state);
      }
    };

    promise.then(function (result) {
      resolveHook && (resolveWith = resolveHook(result));
      next();
    }).catch(function (error) {
      state._errors.push(err || error);
      next();
    });
  });
}

/**
 * Loops over an array calling a function for each item. Expects each call to
 * that function to return a promise. The whole thing resolves once they've all
 * finished.
 *
 * @param  {Object} settings  Contains the following keys...
 *                              state: {State} A state object.
 *                              arr: {Array} An array to loop over.
 *                              iterator: {Function} Used as the iterator function.
 *                              err: {Any} Optional. To be collected for any rejection.
 *                              hook: {Function} Optional. Is run when any promise resolves.
 *
 * @return {Promise}
 */
function promiseIteration(settings) {
  return createNativePromise(function (resolve, reject) {
    var inc = 0;
    var collector = { collection: settings.arr };

    var execFn = function execFn(item, index) {
      var promise = settings.iterator(item, index);
      var didInc = false;

      var next = function next(didResolve, result) {
        if (!didInc) {
          didInc = true;
          inc += 1;
          if (didResolve && settings.hook) {
            collector.item = item;
            collector.index = index;
            collector.result = result;
            collector.isFirstResult = inc === 1;
            collector.isLastResult = inc === settings.arr.length;
            settings.hook(collector);
          }
          inc === settings.arr.length && resolve(settings.state);
        }
      };

      // Allow non-promise values from our iterator calls
      if (!promise || typeof promise.then !== 'function') {
        promise = NativePromise.resolve(promise);
      }

      // When the promise resolves, run a hook if we have one.
      promise.then(function (result) {
        next(true, result);
      }).catch(function (error) {
        var toRejectWith = settings.err || error;

        // Don't reject with circular references to async errors
        if (!(toRejectWith instanceof AsyncError)) {
          settings.state._errors.push(settings.err || error);
        }

        next(false);
      });
    };

    if (settings.arr.length) {
      settings.arr.forEach(function (item, index) {
        return execFn(item, index);
      });
    } else {
      resolve(settings.state);
    }
  });
}

/**
 * Loops over an array calling a function for each item. Expects each call to
 * that function to return a promise. The whole thing resolves once they've all
 * finished. Similar to `promiseIteration` except each iteration only runs
 * after the last one has fully completed and we will bail out early on the
 * very first rejection unless told not to.
 *
 * @param  {Object} settings  Contains the following keys...
 *                              state: {State} A state object.
 *                              arr: {Array} An array to loop over.
 *                              iterator: {Function} Used as the iterator function.
 *                              err: {Any} Optional. To be collected for any rejection.
 *                              hook: {Function} Optional. Is run when any promise resolves.
 *                              nobail: {Boolean} Optional. If true, we won't bail.
 *
 * @return {Promise}
 */
function promiseIterationSync(settings) {
  return createNativePromise(function (resolve, reject) {
    var collector = { collection: settings.arr };

    var runLoop = function runLoop(array, index) {
      if (array.length) {
        var didAdvance = false;
        var item = array[0];
        var promise = settings.iterator(item, index);

        var next = function next(didResolve, result) {
          if (!didAdvance) {
            didAdvance = true;

            if (didResolve && settings.hook) {
              collector.item = item;
              collector.index = index;
              collector.result = result;
              collector.isFirstResult = index === 0;
              collector.isLastResult = index === settings.arr.length - 1;
              settings.hook(collector);
            }

            if (!didResolve && !settings.nobail) {
              resolve(settings.state);
            } else {
              runLoop(array.slice(1), index + 1);
            }
          }
        };

        // Allow non-promise values from our iterator calls
        if (!promise || typeof promise.then !== 'function') {
          promise = NativePromise.resolve(promise);
        }

        // When the promise resolves, run a hook if we have one.
        promise.then(function (result) {
          next(true, result);
        }).catch(function (error) {
          var toRejectWith = settings.err || error;

          // Don't reject with circular references to async errors
          if (!(toRejectWith instanceof AsyncError)) {
            settings.state._errors.push(settings.err || error);
          }

          next(false);
        });
      } else {
        resolve(settings.state);
      }
    };

    runLoop(settings.arr, 0);
  });
}