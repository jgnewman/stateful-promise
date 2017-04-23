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
   */
  function State(value) {
    _classCallCheck(this, State);

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


  _createClass(State, [{
    key: 'handle',
    value: function handle(promise, err) {
      return (0, _utils.statifyPromise)(this, promise, err);
    }

    /**
     * Uses a promise to add/modify a property on an object.
     *
     * @param  {Object}  obj      Some object.
     * @param  {String}  name     The name of the property to set.
     * @param  {Promise} promise  The result of this promise becomes the new value.
     * @param  {Any}     err      Optional. The error to collect if the promise is rejected.
     *
     * @return {Promise} Always resolves with this.
     */

  }, {
    key: 'setTo',
    value: function setTo(obj, name, promise, err) {
      return (0, _utils.statifyPromise)(this, promise, err, function (result) {
        obj[name] = result;
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
      return this.setTo(this, prop, promise, err);
    }

    /**
     * Uses a promise to push an item into an array.
     *
     * @param  {Object}  arr      Some array.
     * @param  {Promise} promise  The result of this promise becomes the new value.
     * @param  {Any}     err      Optional. The error to collect if the promise is rejected.
     *
     * @return {Promise} Always resolves with this.
     */

  }, {
    key: 'pushTo',
    value: function pushTo(arr, promise, err) {
      return (0, _utils.statifyPromise)(this, promise, err, function (result) {
        arr.push(result);
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
      return this.pushTo(this[prop], promise, err);
    }

    /**
     * Uses a promise to unshift an item into an array.
     *
     * @param  {Object}  arr      Some array.
     * @param  {Promise} promise  The result of this promise becomes the new value.
     * @param  {Any}     err      Optional. The error to collect if the promise is rejected.
     *
     * @return {Promise} Always resolves with this.
     */

  }, {
    key: 'unshiftTo',
    value: function unshiftTo(arr, promise, err) {
      return (0, _utils.statifyPromise)(this, promise, err, function (result) {
        arr.unshift(result);
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
      return this.unshiftTo(this[prop], promise, err);
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
      var _this = this;

      var hasErr = arguments.length > 1;
      return (0, _utils.createNativePromise)(function (resolve) {
        !!condition && _this._errors.push(hasErr ? err : 'Condition failed.');
        resolve(_this);
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
      var _this2 = this;

      for (var _len = arguments.length, conditionArrays = Array(_len), _key = 0; _key < _len; _key++) {
        conditionArrays[_key] = arguments[_key];
      }

      return (0, _utils.createNativePromise)(function (resolve) {
        conditionArrays.some(function (arr) {
          var hasErr = arr.length > 1;
          if (!!arr[0]) {
            _this2._errors.push(hasErr ? arr[1] : 'Condition failed.');
            return true;
          }
        });
        resolve(_this2);
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
      return (0, _utils.promiseIteration)({
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

  }, {
    key: 'map',
    value: function map(prop, iterator, err) {
      var _this3 = this;

      return (0, _utils.promiseIteration)({
        state: this,
        arr: this[prop],
        iterator: iterator,
        err: err,
        hook: function hook(item, index, result, next) {
          _this3[prop][index] = result;
          next();
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

  }, {
    key: 'forEachSync',
    value: function forEachSync(prop, iterator, err, nobail) {
      return (0, _utils.promiseIterationSync)({
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

  }, {
    key: 'mapSync',
    value: function mapSync(prop, iterator, err, nobail) {
      var _this4 = this;

      return (0, _utils.promiseIterationSync)({
        state: this,
        arr: this[prop],
        iterator: iterator,
        err: err,
        nobail: nobail,
        hook: function hook(item, index, result, next) {
          _this4[prop][index] = result;
          next();
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

  }, {
    key: 'toObject',
    value: function toObject(settings) {
      var _this5 = this;

      settings = settings || {};
      var output = {};
      Object.keys(this).forEach(function (key) {
        if (key !== '_errors') {
          if (!settings.exclude || settings.exclude.indexOf(key) === -1) {
            output[key] = _this5[key];
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
      var _this6 = this;

      for (var _len2 = arguments.length, keys = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        keys[_key2] = arguments[_key2];
      }

      var output = {};
      Object.keys(this).forEach(function (key) {
        if (keys.indexOf(key) > -1) {
          output[key] = _this6[key];
        }
      });
      return output;
    }
  }]);

  return State;
}();

exports.default = State;