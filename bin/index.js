'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _statefulPromise = require('./stateful-promise');

var _statefulPromise2 = _interopRequireDefault(_statefulPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The main function to be exported.
 * Instantiates a StatefulPromise.
 *
 * @param  {Object} state  Optional. The initial state for the promise chain.
 *
 * @return {StatefulPromise}
 */
function promiser(state) {
  if (state && (typeof state === 'undefined' ? 'undefined' : _typeof(state)) !== 'object') {
    throw new Error('The state you provide to a stateful promise must be an object of some kind.');
  }
  return new _statefulPromise2.default(state || {});
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
    var args = Array.prototype.slice.call(arguments || []);
    return new Promise(function (resolve, reject) {
      var callback = function callback(err, success) {
        err ? reject(err) : resolve(success);
      };
      args.push(callback);
      fn.apply(null, args);
    });
  };
};

exports.default = promiser;