import {
  statifyPromise,
  createNativePromise,
  promiseIteration,
  promiseIterationSync
} from './utils';

/**
 * @class State
 *
 * Creates the state and state methods used in the StatefulPromise
 */
class State {

  /**
   * @constructor
   *
   * Takes an Object (value) and assigns each key to this.
   */
  constructor(value) {
    Object.assign(this, value);
    this._errors = [];
  }

  /**
   * Allows you to handle a raw promise in a stateful-promise way.
   * @param  {Promise} promise  The result of this promise becomes the new value.
   * @param  {Any}     err      Optional. The error to collect if the promise is rejected.
   *
   * @return {Promise} Always resolves with this.
   */
  handle(promise, err) {
    return statifyPromise(this, promise, err);
  }

  /**
   * Uses a promise to add/modify a property on an object.
   *
   * @param  {Object}  obj      Some object.
   * @param  {String}  name     The name of the property to set.
   * @param  {Promise} promise  The result of this promise becomes the new value.
   * @param  {Any}     err      Optional. The error to collect if the promise is rejected.
   *
   * @return {Promise} Resolves with the result of the original promise.
   */
  setTo(obj, name, promise, err) {
    return statifyPromise(this, promise, err, result => {
      obj[name] = result;
      return result;
    });
  }

  /**
   * Uses a promise to add/modify a property on the state.
   *
   * @param  {String}  prop     The name of the property.
   * @param  {Promise} promise  The result of this promise becomes the new value.
   * @param  {Any}     err      Optional. The error to collect if the promise is rejected.
   *
   * @return {Promise} Always resolves with this.
   */
  set(prop, promise, err) {
    return statifyPromise(this, promise, err, result => {
      this[prop] = result;
    });
  }

  /**
   * Uses a promise to push an item into an array.
   *
   * @param  {Object}  arr      Some array.
   * @param  {Promise} promise  The result of this promise becomes the new value.
   * @param  {Any}     err      Optional. The error to collect if the promise is rejected.
   *
   * @return {Promise} Always resolves with the result of the original.
   */
  pushTo(arr, promise, err) {
    return statifyPromise(this, promise, err, result => {
      arr.push(result);
      return result;
    });
  }

  /**
   * Uses a promise to push an item into an array on the state.
   *
   * @param  {String}  prop     The name of an array on the state.
   * @param  {Promise} promise  The result of this promise becomes the new value.
   * @param  {Any}     err      Optional. The error to collect if the promise is rejected.
   *
   * @return {Promise} Always resolves with this.
   */
  push(prop, promise, err) {
    return statifyPromise(this, promise, err, result => {
      this[prop].push(result);
    });
  }

  /**
   * Uses a promise to unshift an item into an array.
   *
   * @param  {Object}  arr      Some array.
   * @param  {Promise} promise  The result of this promise becomes the new value.
   * @param  {Any}     err      Optional. The error to collect if the promise is rejected.
   *
   * @return {Promise} Always resolves with the result of the original promise.
   */
  unshiftTo(arr, promise, err) {
    return statifyPromise(this, promise, err, result => {
      arr.unshift(result);
      return result;
    });
  }

  /**
   * Uses a promise to unshift an item into an array on the state.
   *
   * @param  {String}  prop     The name of an array on the state.
   * @param  {Promise} promise  The result of this promise becomes the new value.
   * @param  {Any}     err      Optional. The error to collect if the promise is rejected.
   *
   * @return {Promise} Always resolves with this.
   */
  unshift(prop, promise, err) {
    return statifyPromise(this, promise, err, result => {
      this[prop].unshift(result);
    });
  }

  /**
   * Manually trigger a rejection in your chain under some condition.
   * If the condition is not met, resolves.
   *
   * @param {Boolean-ish} condition  Will be assessed for its truthiness.
   * @param {Any}         err        The error to reject with if the condition is true.
   *
   * @return {Promise} Always resolves with this.
   */
  rejectIf(condition, err) {
    const hasErr = arguments.length > 1;
    return createNativePromise(resolve => {
      !!condition && this._errors.push(hasErr ? err : 'Condition failed.');
      resolve(this);
    });
  }

  /**
   * Manually trigger a rejection in your chain under one of many conditions.
   * If none of the conditions are met, resolves.
   *
   * @param {Arrays} conditionArrays  Where position 0 is a boolean and
   *                                  position 1 (optional) is an error to reject
   *                                  with if the boolean is false.
   *
   * @return {Promise} Always resolves with this.
   */
  rejectIfAny(...conditionArrays) {
    return createNativePromise(resolve => {
      conditionArrays.some(arr => {
        const hasErr = arr.length > 1;
        if (!!arr[0]) {
          this._errors.push(hasErr ? arr[1] : 'Condition failed.');
          return true;
        }
      });
      resolve(this);
    });
  }

  /**
   * Asynchronously loops over each item in a state property calling an
   * iterator for each one that returns a promise. It returns a promise itself
   * that only resolves once all iterations have finished.
   *
   * @param  {String}  prop      The name of the property to loop over.
   * @param  {Promise} iterator  The iterator function, taking item and index.
   *                             Be careful how you use index since this is async.
   * @param  {Any}     err       Optional. The error to collect if any promise is rejected.
   *
   * @return {Promise} Always resolves with this.
   */
  forEach(prop, iterator, err) {
    return promiseIteration({
      state: this,
      arr: this[prop],
      iterator: iterator,
      err: err
    });
  }

  /**
   * Asynchronously maps each item in a state property calling an
   * iterator for each one that returns a promise. The resolved value of each
   * of these promises will become the new value for that array index.
   *
   * @param  {String}  prop      The name of the property to loop over.
   * @param  {Promise} iterator  The iterator function, taking item and index.
   *                             Be careful how you use index since this is async.
   * @param  {Any}     err       Optional. The error to collect if any promise is rejected.
   *
   * @return {Promise} Always resolves with this.
   */
  map(prop, iterator, err) {
    return promiseIteration({
      state: this,
      arr: this[prop],
      iterator: iterator,
      err: err,
      hook: (collector) => {
        collector.collection[collector.index] = collector.result;
      }
    });
  }

  /**
   * Asynchronously loops over each item in a state property with the purpose
   * of filtering out unneeded items. It calls an iterator for each one that
   * returns a promise. If the resolved value of an iterator promise is truthy,
   * the corresponding item in an array will be kept. Otherwise it will be
   * removed. Note that because this is async, the resulting array may not be
   * in the original order.
   *
   * @param  {String}  prop      The name of the property to loop over.
   * @param  {Promise} iterator  The iterator function, taking item and index.
   *                             Be careful how you use index since this is async.
   * @param  {Any}     err       Optional. The error to collect if any promise is rejected.
   *
   * @return {Promise} Always resolves with this.
   */
  filter(prop, iterator, err) {
    return promiseIteration({
      state: this,
      arr: this[prop],
      iterator: iterator,
      err: err,
      hook: (collector) => {
        if (collector.isFirstResult) {
          collector.newCollection = [];
        }

        if (collector.result) {
          collector.newCollection.push(collector.item)
        }

        if (collector.isLastResult) {
          this[prop] = collector.newCollection;
        }
      }
    });
  }

  /**
   * Synchronously loops over each item in a state property, calling an
   * iterator for each one that returns a promise. It returns a promise itself
   * that only resolves once all iterations have finished. By default, it will
   * reject the whole thing as soon as any rejection occurs unless you tell it
   * not to.
   *
   * @param  {String}  prop      The name of the property to loop over.
   * @param  {Promise} iterator  The iterator function, taking item and index.
   * @param  {Any}     err       Optional. The error to collect if any promise is rejected.
   * @param  {Boolean} nobail    Optional. If true, we won't bail out after the first rejection.
   *
   * @return {Promise} Always resolves with this.
   */
  forEachSync(prop, iterator, err, nobail) {
    return promiseIterationSync({
      state: this,
      arr: this[prop],
      iterator: iterator,
      err: err,
      nobail: nobail
    });
  }

  /**
   * Asynchronously maps each item in a state property calling an
   * iterator for each one that returns a promise. The resolved value of each
   * of these promises will become the new value for that array index.
   * It returns a promise itself that only resolves once all iterations have
   * finished. By default, it will reject the whole thing as soon as any
   * rejection occurs unless you tell it not to.
   *
   * @param  {String}  prop      The name of the property to loop over.
   * @param  {Promise} iterator  The iterator function, taking item and index.
   * @param  {Any}     err       Optional. The error to collect if any promise is rejected.
   * @param  {Boolean} nobail    Optional. If true, we won't bail out after the first rejection.
   *
   * @return {Promise} Always resolves with this.
   */
  mapSync(prop, iterator, err, nobail) {
    return promiseIterationSync({
      state: this,
      arr: this[prop],
      iterator: iterator,
      err: err,
      nobail: nobail,
      hook: (collector) => {
        collector.collection[collector.index] = collector.result;
      }
    });
  }

  /**
   * Synchronously loops over each item in a state property with the purpose
   * of filtering out unneeded items. It calls an iterator for each one that
   * returns a promise. If the resolved value of an iterator promise is truthy,
   * the corresponding item in an array will be kept. Otherwise it will be
   * removed. Using `filterSync` ensures that the array remains in the same order
   * but it is much slower.
   *
   * @param  {String}  prop      The name of the property to loop over.
   * @param  {Promise} iterator  The iterator function, taking item and index.
   * @param  {Any}     err       Optional. The error to collect if any promise is rejected.
   * @param  {Boolean} nobail    Optional. If true, we won't bail out after the first rejection.
   *
   * @return {Promise} Always resolves with this.
   */
  filterSync(prop, iterator, err, nobail) {
    return promiseIteration({
      state: this,
      arr: this[prop],
      iterator: iterator,
      err: err,
      nobail: nobail,
      hook: (collector) => {
        if (collector.isFirstResult) {
          collector.newCollection = [];
        }

        if (collector.result) {
          collector.newCollection.push(collector.item)
        }

        if (collector.isLastResult) {
          this[prop] = collector.newCollection;
        }
      }
    });
  }

  /**
   * Converts the state into a plain object.
   *
   * @param {Object} settings  Optional. Contains the following keys:
   *                           includeErrors: {Boolean} If true, includes the _errors property.
   *                           exclude:       {Array}   Names of properties to exclude in the output.
   *
   * @return {Object}
   */
  toObject(settings) {
    settings = settings || {};
    const output = {};
    Object.keys(this).forEach(key => {
      if (key !== '_errors') {
        if (!settings.exclude || settings.exclude.indexOf(key) === -1) {
          output[key] = this[key];
        }
      }
    });
    if (settings.includeErrors) {
      output._errors = this._errors;
    }
    return output;
  }

  /**
   * Converts the state into a plain object only containing the requested keys.
   *
   * @param {Strings} keys  Each key to be included in the output.
   *
   * @return {Object}
   */
  toPartialObject(...keys) {
    const output = {};
    Object.keys(this).forEach(key => {
      if (keys.indexOf(key) > -1) {
        output[key] = this[key];
      }
    });
    return output;
  }

}

export default State;
