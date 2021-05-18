"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr && (typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]); if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/**
 * DomainStorage library
 * Provides a client to use with subdomain to access the shared local storage from parent domain through DomainStorage
 */
var _require = require('uuid'),
    uuidv4 = _require.v4;

var _this;

var _serverUrl;

var _iframe;

var _whenServerReady;

var _timeout = 10000;
var _pendingActions = {}; // DomainStorage constructor

var DomainStorage = function DomainStorage() {
  // Ensure singleton instance
  if (_this !== undefined) {
    return _this;
  } // Check for support


  if (!window || !window.postMessage) {
    console.error('Missing feature support. Exiting!');
    return;
  } // Save a reference to this


  _this = this; // If env var is set, set server URL

  if (typeof process !== 'undefined' && process.env.DOMAIN_STORATE_HOST) {
    setServerUrl(process.env.DOMAIN_STORATE_HOST);
  } // Init response event listener from server


  window.addEventListener('message', function (event) {
    if (!isMessageTrusted(event.origin) || // Message is from somewhere else
    event.data.type !== 'domain_storage_msg' // Message is not related to domain storage
    ) return;

    if (event.data.actionId) {
      // Got response for an action request
      var _event$data = event.data,
          actionId = _event$data.actionId,
          success = _event$data.success,
          response = _event$data.response;
      if (_pendingActions[actionId] === undefined) return; // Unexpected

      var _pendingActions$actio = _slicedToArray(_pendingActions[actionId], 2),
          resolve = _pendingActions$actio[0],
          reject = _pendingActions$actio[1]; // Delete pending action


      delete _pendingActions[actionId]; // Respond according to status

      (success ? resolve : reject)(response);
    }
  }, false);
  return _this;
};

var isMessageTrusted = function isMessageTrusted(origin) {
  // todo also verify the source of the message
  return _serverUrl && origin === new URL(_serverUrl).origin;
};

var getItem = function getItem(key) {
  return requestAction('getItem', {
    key: key
  });
};

var setItem = function setItem(key, value) {
  return requestAction('setItem', {
    key: key,
    value: value
  });
};

var removeItem = function removeItem(key) {
  return requestAction('removeItem', {
    key: key
  });
};

var requestAction = function requestAction(action, props) {
  if (_whenServerReady === undefined) {
    return Promise.reject(new Error('Server URL not set'));
  }

  return _whenServerReady.then(function () {
    // Start a timeout to reject promise
    var timeoutRef;
    return new Promise(function (resolve, reject) {
      var actionId = uuidv4(); // Save to be resolved or rejected at response

      _pendingActions[actionId] = [resolve, reject]; // Timeout to reject the promise if not fulfilled on time

      timeoutRef = setTimeout(function () {
        reject(new Error('Operation timed out'));
        delete _pendingActions[actionId];
      }, _timeout); // Post message to host

      _iframe.contentWindow.postMessage(_objectSpread({
        type: 'domain_storage_msg',
        action: action,
        actionId: actionId
      }, props), _serverUrl);
    })["finally"](function () {
      clearTimeout(timeoutRef);
    });
  });
};

var setServerUrl = function setServerUrl(url) {
  if (typeof url !== 'string') {
    throw new Error('Host must be a string');
  }

  _serverUrl = url;
  initIframe();
};

var getServerUrl = function getServerUrl() {
  return _serverUrl;
};

var setFailTimeout = function setFailTimeout(timeout) {
  if (typeof timeout !== 'number') {
    throw new Error('Timeout must be a number');
  }

  _timeout = timeout;
};

var initIframe = function initIframe() {
  // todo append iframe only when dom is ready
  if (_iframe === undefined) {
    _iframe = window.document.createElement('iframe'); // todo change to hidden

    _iframe.style.display = 'none';
    _iframe.width = '0';
    _iframe.height = '0';
    _iframe.src = _serverUrl;
    window.document.body.appendChild(_iframe);
  }

  var timeoutRef, serverReadyListener; // Recreate the promise on every iframe src change

  _whenServerReady = new Promise(function (resolve, reject) {
    // Timeout to reject the promise if not fulfilled on time
    timeoutRef = setTimeout(function () {
      return reject(new Error('Server connection timed out'));
    }, _timeout); // Server ready listener - for removing it in finally

    serverReadyListener = function serverReadyListener(event) {
      if (!isMessageTrusted(event.origin) || // Message is from somewhere else
      event.data.type !== 'domain_storage_msg' // Message is not related to domain storage
      ) return;

      if (event.data.ready) {
        // Resolve when ready message is received
        clearTimeout(timeoutRef);
        resolve();
      }
    }; // Listen to iframe ready message


    window.addEventListener('message', serverReadyListener, false);
  })["finally"](function () {
    clearTimeout(timeoutRef);
    window.removeEventListener('message', serverReadyListener);
  });
  _iframe.src = _serverUrl;
}; // Instance methods


DomainStorage.prototype = {
  setServerUrl: setServerUrl,
  getServerUrl: getServerUrl,
  setFailTimeout: setFailTimeout,
  getItem: getItem,
  setItem: setItem,
  removeItem: removeItem
};

var _default = new DomainStorage();

exports["default"] = _default;
module.exports = exports.default;