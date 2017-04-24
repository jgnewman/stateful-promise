import StatefulPromise from './stateful-promise';
import { assignPromiseEngine, createNativePromise, getNativePromise } from './utils';

/**
 * The main function to be exported.
 * Instantiates a StatefulPromise.
 *
 * @param  {Object} state  Optional. The initial state for the promise chain.
 *
 * @return {StatefulPromise}
 */
function promiser(state) {
  if (state && typeof state !== 'object') {
    throw new Error('The state you provide to a stateful promise must be an object of some kind.');
  }
  return new StatefulPromise(state || {});
}

/**
 * Determines the Promise engine that will be used for all
 * Promise instantiation. If not called, we'll default to Promise which
 * may or may not exist in all environments.
 *
 * @param  {Class} engine  Should implement Promises A+
 *
 * @return {undefined}
 */
promiser.use = function (engine) {
  return assignPromiseEngine(engine);
};

/**
 * Wraps a callback-using function such that it uses a promise instead.
 *
 * @param  {Function} asyncWithCallback  The function to wrap.
 *
 * @return {Function} Calls a promise-wrapped version of the original function.
 */
promiser.wrap = function (fn) {
  return function () {
    const args = Array.prototype.slice.call(arguments || []);
    return createNativePromise((resolve, reject) => {
      const callback = function (err, success) {
        err ? reject(err) : resolve(success);
      };
      args.push(callback);
      fn.apply(null, args);
    });
  }
};

/**
 * Allows you to recurse over a function many times until ultimately
 * resolving or rejecting the recurser.
 *
 * @param  {Function} fn  Executes as many times as you want. Call it again by
 *                        calling `next`, or call `resolve/reject` to end.
 *
 * @return {Promise}
 */
promiser.recur = function (fn) {
  return createNativePromise((resolve, reject) => {
    const next = () => fn(next, resolve, reject);
    next();
  });
};

/**
 * Allows you to hook into the resolution of a promise and perform
 * an action before the rest of the promise chain is executed.
 * NOTE: Because hooks may contain async actions, you'll need to call
 * the `next` function to continue the chain.
 *
 * @param  {Promise}  promise Any promise.
 * @param  {Function} hook    What to do when a promise resolves.
 *
 * @return {Promise} Resolves/rejects in accordance with the argument promise.
 */
promiser.hook = function (promise, hook) {
  return createNativePromise((resolve, reject) => {
    promise.then(result => {
      const next = () => resolve(result);
      hook(result, next);
    })
    .catch(err => {
      reject(err);
    })
  });
};

// Make this thing _consistently_ available.
module.exports = exports = promiser;
