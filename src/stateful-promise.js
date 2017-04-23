import { executeChain } from './utils';
import State from './state';

/**
 * @class StatefulPromise
 *
 * Wraps the promise API to be able to always have an available state
 * that provides useful, promise-based methods for iterating on it.
 */
class StatefulPromise {

  /**
   * @constructor
   *
   * Instantiates a State, sets up a new run loop to execute
   * a chain of promises.
   */
  constructor(state) {
    this.state = new State(state || {});
    this.queue = [];
    this.catchers = [];

    // In the next run loop, recursively iterate over each of
    // our promises in the queue/catcher queue.
    setTimeout(() => {
      executeChain(this, this.queue, false);
    }, 0);
  }

  /**
   * Obfuscate the `then` method by simply pushing a function to
   * the queue. These promise-returning functions will be chained
   * on the next run loop.
   *
   * @param {Function} fn  Registers the next function in the promise queue.
   *
   * @return {StatefulPromise} this.
   */
  then(fn) {
    this.queue.push(() => {
      return fn(this.state);
    });
    return this;
  }

  /**
   * Obfuscate the `catch` method by simply pushing a function to
   * the catchers queue. Promise-returning functions will be chained
   * on the next run loop.
   *
   * @param {Function} fn  Registers the next function in the catchers queue.
   *
   * @return {StatefulPromise} this.
   */
  catch(fn) {
    this.catchers.push(() => {
      return fn(this.state, ...this.state._errors);
    });
    return this;
  }
}

export default StatefulPromise;
