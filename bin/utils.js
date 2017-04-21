"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeChain = executeChain;

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
      if (queueIsCatchers || !statefulPromise.state.errors.length) {
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