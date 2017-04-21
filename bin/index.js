'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = promiser;

var _statefulPromise = require('./stateful-promise');

var _statefulPromise2 = _interopRequireDefault(_statefulPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function promiser(state) {
  if (state && (typeof state === 'undefined' ? 'undefined' : _typeof(state)) !== 'object') {
    throw new Error('The state you provide to a stateful promise must be an object of some kind.');
  }
  return new _statefulPromise2.default(state || {});
};