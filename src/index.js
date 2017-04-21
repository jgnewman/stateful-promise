import StatefulPromise from './stateful-promise';

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
 * Wraps a callback-using function such that it uses a promise instead.
 *
 * @param  {Function} asyncWithCallback  The function to wrap.
 *
 * @return {Function} Calls a promise-wrapped version of the original function.
 */
promiser.wrap = function (fn) {
  return function () {
    const args = Array.prototype.slice.call(arguments || []);
    return new Promise((resolve, reject) => {
      const callback = function (err, success) {
        err ? reject(err) : resolve(success);
      };
      args.push(callback);
      fn.apply(null, args);
    });
  }
};

export default promiser;
