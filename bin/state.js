'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('./utils');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class State
 *
 * Creates the state and state methods used in the StatefulPromise
 */
var State = function () {

  /**
   * @constructor
   *
   * Takes an Object (value) and assigns each key to this.
   * Also takes a circular reference to the promiser object that owns it
   */
  function State(value, promiser) {
    _classCallCheck(this, State);

    Object.assign(this, value);
    this._errors = [];
    this._promiser = promiser;
  }

  /**
   * Allows you to handle a raw promise in a stateful-promise way.
   * @param  {Promise} promise  The result of this promise becomes the new value.
   * @param  {Any}     err      Optional. The error to collect if the promise is rejected.
   *
   * @return {Promise} Always resolves with this.
   */


  _createClass(State, [{
    key: 'handle',
    value: function handle(promise, err) {
      var _this = this;

      return (0, _utils.statifyPromise)(this, promise, err).then(function (val) {
        return (0, _utils.fixAsyncAwait)(_this, val);
      });
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

  }, {
    key: 'setTo',
    value: function setTo(obj, name, promise, err) {
      var _this2 = this;

      return (0, _utils.statifyPromise)(this, promise, err, function (result) {
        obj[name] = result;
        return result;
      }).then(function (val) {
        return (0, _utils.fixAsyncAwait)(_this2, val);
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

  }, {
    key: 'set',
    value: function set(prop, promise, err) {
      var _this3 = this;

      return (0, _utils.statifyPromise)(this, promise, err, function (result) {
        _this3[prop] = result;
      }).then(function (val) {
        return (0, _utils.fixAsyncAwait)(_this3, val);
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

  }, {
    key: 'pushTo',
    value: function pushTo(arr, promise, err) {
      var _this4 = this;

      return (0, _utils.statifyPromise)(this, promise, err, function (result) {
        arr.push(result);
        return result;
      }).then(function (val) {
        return (0, _utils.fixAsyncAwait)(_this4, val);
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

  }, {
    key: 'push',
    value: function push(prop, promise, err) {
      var _this5 = this;

      return (0, _utils.statifyPromise)(this, promise, err, function (result) {
        _this5[prop].push(result);
      }).then(function (val) {
        return (0, _utils.fixAsyncAwait)(_this5, val);
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

  }, {
    key: 'unshiftTo',
    value: function unshiftTo(arr, promise, err) {
      var _this6 = this;

      return (0, _utils.statifyPromise)(this, promise, err, function (result) {
        arr.unshift(result);
        return result;
      }).then(function (val) {
        return (0, _utils.fixAsyncAwait)(_this6, val);
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

  }, {
    key: 'unshift',
    value: function unshift(prop, promise, err) {
      var _this7 = this;

      return (0, _utils.statifyPromise)(this, promise, err, function (result) {
        _this7[prop].unshift(result);
      }).then(function (val) {
        return (0, _utils.fixAsyncAwait)(_this7, val);
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

  }, {
    key: 'rejectIf',
    value: function rejectIf(condition, err) {
      var _this8 = this;

      var hasErr = arguments.length > 1;
      return (0, _utils.createNativePromise)(function (resolve) {
        !!condition && _this8._errors.push(hasErr ? err : 'Condition failed.');
        resolve(_this8);
      }).then(function (val) {
        return (0, _utils.fixAsyncAwait)(_this8, val);
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

  }, {
    key: 'rejectIfAny',
    value: function rejectIfAny() {
      var _this9 = this;

      for (var _len = arguments.length, conditionArrays = Array(_len), _key = 0; _key < _len; _key++) {
        conditionArrays[_key] = arguments[_key];
      }

      return (0, _utils.createNativePromise)(function (resolve) {
        conditionArrays.some(function (arr) {
          var hasErr = arr.length > 1;
          if (!!arr[0]) {
            _this9._errors.push(hasErr ? arr[1] : 'Condition failed.');
            return true;
          }
        });
        resolve(_this9);
      }).then(function (val) {
        return (0, _utils.fixAsyncAwait)(_this9, val);
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

  }, {
    key: 'forEach',
    value: function forEach(prop, iterator, err) {
      var _this10 = this;

      return (0, _utils.promiseIteration)({
        state: this,
        arr: this[prop],
        iterator: iterator,
        err: err
      }).then(function (val) {
        return (0, _utils.fixAsyncAwait)(_this10, val);
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

  }, {
    key: 'map',
    value: function map(prop, iterator, err) {
      var _this11 = this;

      return (0, _utils.promiseIteration)({
        state: this,
        arr: this[prop],
        iterator: iterator,
        err: err,
        hook: function hook(collector) {
          collector.collection[collector.index] = collector.result;
        }
      }).then(function (val) {
        return (0, _utils.fixAsyncAwait)(_this11, val);
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

  }, {
    key: 'filter',
    value: function filter(prop, iterator, err) {
      var _this12 = this;

      return (0, _utils.promiseIteration)({
        state: this,
        arr: this[prop],
        iterator: iterator,
        err: err,
        hook: function hook(collector) {
          if (collector.isFirstResult) {
            collector.newCollection = [];
          }

          if (collector.result) {
            collector.newCollection.push(collector.item);
          }

          if (collector.isLastResult) {
            _this12[prop] = collector.newCollection;
          }
        }
      }).then(function (val) {
        return (0, _utils.fixAsyncAwait)(_this12, val);
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

  }, {
    key: 'forEachSync',
    value: function forEachSync(prop, iterator, err, nobail) {
      var _this13 = this;

      return (0, _utils.promiseIterationSync)({
        state: this,
        arr: this[prop],
        iterator: iterator,
        err: err,
        nobail: nobail
      }).then(function (val) {
        return (0, _utils.fixAsyncAwait)(_this13, val);
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

  }, {
    key: 'mapSync',
    value: function mapSync(prop, iterator, err, nobail) {
      var _this14 = this;

      return (0, _utils.promiseIterationSync)({
        state: this,
        arr: this[prop],
        iterator: iterator,
        err: err,
        nobail: nobail,
        hook: function hook(collector) {
          collector.collection[collector.index] = collector.result;
        }
      }).then(function (val) {
        return (0, _utils.fixAsyncAwait)(_this14, val);
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

  }, {
    key: 'filterSync',
    value: function filterSync(prop, iterator, err, nobail) {
      var _this15 = this;

      return (0, _utils.promiseIteration)({
        state: this,
        arr: this[prop],
        iterator: iterator,
        err: err,
        nobail: nobail,
        hook: function hook(collector) {
          if (collector.isFirstResult) {
            collector.newCollection = [];
          }

          if (collector.result) {
            collector.newCollection.push(collector.item);
          }

          if (collector.isLastResult) {
            _this15[prop] = collector.newCollection;
          }
        }
      }).then(function (val) {
        return (0, _utils.fixAsyncAwait)(_this15, val);
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

  }, {
    key: 'toObject',
    value: function toObject(settings) {
      var _this16 = this;

      settings = settings || {};
      var output = {};
      Object.keys(this).forEach(function (key) {
        if (key !== '_errors' && key !== '_promiser') {
          if (!settings.exclude || settings.exclude.indexOf(key) === -1) {
            output[key] = _this16[key];
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

  }, {
    key: 'toPartialObject',
    value: function toPartialObject() {
      var _this17 = this;

      for (var _len2 = arguments.length, keys = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        keys[_key2] = arguments[_key2];
      }

      var output = {};
      Object.keys(this).forEach(function (key) {
        if (keys.indexOf(key) > -1) {
          output[key] = _this17[key];
        }
      });
      return output;
    }
  }]);

  return State;
}();

exports.default = State;