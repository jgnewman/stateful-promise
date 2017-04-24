'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createNativePromise = createNativePromise;
exports.assignPromiseEngine = assignPromiseEngine;
exports.executeChain = executeChain;
exports.statifyPromise = statifyPromise;
exports.promiseIteration = promiseIteration;
exports.promiseIterationSync = promiseIterationSync;
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

      // When the promise resolves, run a hook if we have one.
      promise.then(function (result) {
        next(true, result);
      }).catch(function (error) {
        settings.state._errors.push(settings.err || error);
        next(false);
      });
    };

    settings.arr.forEach(function (item, index) {
      return execFn(item, index);
    });
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

        // When the promise resolves, run a hook if we have one.
        promise.then(function (result) {
          next(true, result);
        }).catch(function (error) {
          settings.state._errors.push(settings.err || error);
          next(false);
        });
      } else {
        resolve(settings.state);
      }
    };

    runLoop(settings.arr, 0);
  });
}