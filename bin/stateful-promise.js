'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = require('./utils');

var _state = require('./state');

var _state2 = _interopRequireDefault(_state);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @class StatefulPromise
 *
 * Wraps the promise API to be able to always have an available state
 * that provides useful, promise-based methods for iterating on it.
 */
var StatefulPromise = function () {

  /**
   * @constructor
   *
   * Instantiates a State, sets up a new run loop to execute
   * a chain of promises.
   */
  function StatefulPromise(state) {
    var _this = this;

    _classCallCheck(this, StatefulPromise);

    this.state = new _state2.default(state || {});
    this.queue = [];
    this.catchers = [];

    // In the next run loop, recursively iterate over each of
    // our promises in the queue/catcher queue.
    setTimeout(function () {
      (0, _utils.executeChain)(_this, _this.queue, false);
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


  _createClass(StatefulPromise, [{
    key: 'then',
    value: function then(fn) {
      var _this2 = this;

      this.queue.push(function () {
        return fn(_this2.state);
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

  }, {
    key: 'catch',
    value: function _catch(fn) {
      var _this3 = this;

      this.catchers.push(function () {
        return fn.apply(undefined, [_this3.state].concat(_toConsumableArray(_this3.state.errors)));
      });
      return this;
    }
  }]);

  return StatefulPromise;
}();

exports.default = StatefulPromise;