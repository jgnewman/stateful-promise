"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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
    var _this = this;

    _classCallCheck(this, State);

    Object.keys(value).forEach(function (key) {
      return _this[key] = value[key];
    });
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


  _createClass(State, [{
    key: "set",
    value: function set(prop, promise, err) {
      var _this2 = this;

      return new Promise(function (resolve) {
        var didResolve = false;

        var next = function next() {
          if (!didResolve) {
            didResolve = true;
            resolve(_this2);
          }
        };

        promise.then(function (result) {
          _this2[prop] = result;
          next();
        }).catch(function (error) {
          _this2.errors.push(err || error);
          next();
        });
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

  }, {
    key: "forEach",
    value: function forEach(prop, promiseIterator, settings) {
      var _this3 = this;

      settings = settings || {};
      return new Promise(function (resolve, reject) {
        var arr = _this3[prop];
        var inc = 0;

        var execFn = function execFn(item, index) {
          var promise = promiseIterator(item, index);
          var didInc = false;

          var next = function next() {
            if (!didInc) {
              didInc = true;
              inc += 1;
              inc === arr.length && resolve(_this3);
            }
          };

          promise.then(function (result) {
            settings.map && (arr[index] = result);
            next();
          }).catch(function (error) {
            _this3.errors.push(settings.err || error);
            next();
          });
        };

        arr.forEach(function (item, index) {
          return execFn(item, index);
        });
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

  }, {
    key: "forEachSync",
    value: function forEachSync(prop, promiseIterator, settings) {
      var _this4 = this;

      settings = settings || {};
      return new Promise(function (resolve) {
        var origVal = _this4[prop];

        var runLoop = function runLoop(arr, index) {
          if (arr.length) {
            var didAdvance = false;
            var promise = promiseIterator(arr[0], index);

            var next = function next(didReject) {
              if (!didAdvance) {
                didAdvance = true;
                if (settings.bail && didReject) {
                  resolve(_this4);
                } else {
                  runLoop(arr.slice(1), index + 1);
                }
              }
            };

            promise.then(function (result) {
              settings.map && (origVal[index] = result);
              next();
            }).catch(function (error) {
              _this4.errors.push(settings.err || error);
              next(true);
            });
          } else {
            resolve(_this4);
          }
        };

        runLoop(origVal, 0);
      });
    }
  }]);

  return State;
}();

exports.default = State;