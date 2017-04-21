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
    Object.keys(value).forEach(key => this[key] = value[key]);
    this.errors = [];
  }

  /**
   * Uses a promise to add/modify a property on this.
   *
   * @param  {String}  prop     The name of the property.
   * @param  {Promise} promise  The result of this promise becomes the new value.
   * @param  {Any}     err      Optional. The error to collect if the promise is rejected.
   *
   * @return {Promise} Always resolves with this.
   */
  set(prop, promise, err) {
    return new Promise(resolve => {
      let didResolve = false;

      const next = () => {
        if (!didResolve) {
          didResolve = true;
          resolve(this);
        }
      }

      promise.then(result => {
        this[prop] = result;
        next();
      })

      .catch(error => {
        this.errors.push(err || error);
        next();
      });
    });
  }

  /**
   * Manually trigger a rejection in your chain under some condition.
   * If the condition is not met, resolves.
   *
   * @param {Any} condition  Will be assessed for its truthiness.
   * @param {Any} err        The error to reject with if the condition is true.
   *
   * @return {Promise} Always resolves with this.
   */
  rejectIf(condition, err) {
    return new Promise(resolve => {
      !!condition && this.errors.push(err);
      resolve(this);
    });
  }

  /**
   * Asynchronously loops over each item in a state property, calling an
   * iterator for each one that returns a promise. It returns a promise itself
   * that only resolves once all iterations have finished.
   *
   * @param  {String}  prop             The name of the property to loop over.
   * @param  {Promise} promiseIterator  The iterator function, taking item and index.
   *                                    Be careful how you use index since this is async.
   * @param  {Object} settings          Optional. Allows the following keys:
   *                                      err: {Any} The error to collect if any promise is rejected.
   *                                      map: {Boolean} If true, maps new changes to the existing property.
   *                                      (no bail key here because that doesn't work with async)
   *
   * @return {Promise} Always resolves with this.
   */
  forEach(prop, promiseIterator, settings) {
    settings = settings || {};
    return new Promise((resolve, reject) => {
      const arr = this[prop];
      let   inc = 0;

      const execFn = (item, index) => {
        const promise = promiseIterator(item, index);
        let   didInc  = false;

        const next = () => {
          if (!didInc) {
            didInc = true;
            inc += 1;
            inc === arr.length && resolve(this);
          }
        }

        promise.then(result => {
          settings.map && (arr[index] = result);
          next();
        })

        .catch(error => {
          this.errors.push(settings.err || error);
          next();
        });
      };

      arr.forEach((item, index) => execFn(item, index));

    });
  }

  /**
   * Synchronously loops over each item in a state property, calling an
   * iterator for each one that returns a promise. It returns a promise itself
   * that only resolves once all iterations have finished.
   *
   * @param  {String}  prop             The name of the property to loop over.
   * @param  {Promise} promiseIterator  The iterator function, taking item and index.
   * @param  {Object} settings          Optional. Allows the following keys:
   *                                      err: {Any} The error to collect if any promise is rejected.
   *                                      map: {Boolean} If true, maps new changes to the existing property.
   *                                      bail: {Boolean} If true, will bail out of the loop after the first rejection.
   *
   * @return {Promise} Always resolves with this.
   */
  forEachSync(prop, promiseIterator, settings) {
    settings = settings || {};
    return new Promise(resolve => {
      const origVal = this[prop];

      const runLoop = (arr, index) => {
        if (arr.length) {
          let didAdvance = false;
          const promise = promiseIterator(arr[0], index);

          const next = (didReject) => {
            if (!didAdvance) {
              didAdvance = true;
              if (settings.bail && didReject) {
                resolve(this);
              } else {
                runLoop(arr.slice(1), index + 1);
              }
            }
          };

          promise.then(result => {
            settings.map && (origVal[index] = result);
            next();
          })

          .catch(error => {
            this.errors.push(settings.err || error);
            next(true);
          });

        } else {
          resolve(this);
        }
      }

      runLoop(origVal, 0);

    });
  }
}

export default State;
