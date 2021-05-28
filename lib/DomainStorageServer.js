"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

/**
 * DomainStorageServer library
 * Provides a mechanism to share local storage between a parent domain and subdomains
 */
var _this, _referrerOrigin;

var _trustedDomains = []; // DomainStorageServer constructor

var DomainStorageServer = function DomainStorageServer() {
  // Ensure singleton instance
  if (_this !== undefined) {
    return _this;
  } // Check for support


  if (!window || !window.postMessage) {
    console.error('Missing feature support. Exiting!');
    return;
  } // Check for referrer


  if (!document.referrer) {
    console.error('No referrer found');
    return;
  }

  _referrerOrigin = new URL(document.referrer).origin; // todo initialize a listener that listens, takes action, and responds with another message
  // Save a reference to this

  _this = this;
  return _this;
};

var start = function start() {
  // Listen to messages
  window.addEventListener('message', function (event) {
    if (!isMessageTrusted(event.origin) || // Message is from somewhere else
    event.data.type !== 'domain_storage_msg' // Message is not related to domain storage
    ) return;

    var _event$data = event.data,
        action = _event$data.action,
        actionId = _event$data.actionId,
        props = _objectWithoutProperties(_event$data, ["action", "actionId"]); // Respond with actionId, success, response


    handleActionRequest(action, actionId, props);
  }, false);
  window.top.postMessage({
    type: 'domain_storage_msg',
    ready: true
  }, _referrerOrigin);
};

var getParentDomain = function getParentDomain(hostname) {
  return hostname.split('.').slice(-2).join('.');
};

var isMessageTrusted = function isMessageTrusted(origin) {
  var hostname = new URL(origin).hostname; // todo also verify the source of the message

  return _trustedDomains.includes(hostname) || getParentDomain(hostname) === getParentDomain(window.location.hostname);
};

var handleActionRequest = function handleActionRequest(action, actionId, props) {
  var key = "DomainStorage::".concat(props.key);

  switch (action) {
    case 'getItem':
      return respond(actionId, true, localStorage.getItem(key));

    case 'setItem':
      return respond(actionId, true, localStorage.setItem(key, props.value));

    case 'removeItem':
      return respond(actionId, true, localStorage.removeItem(key));

    default:
      return respond(actionId, false, new Error('Invalid action request'));
  }
};

var respond = function respond(actionId, success, response) {
  window.top.postMessage({
    type: 'domain_storage_msg',
    actionId: actionId,
    success: success,
    response: response
  }, _referrerOrigin);
};

var setTrustedDomains = function setTrustedDomains(trustedDomains) {
  if (trustedDomains instanceof Array) {
    _trustedDomains = trustedDomains;
  }
}; // Instance methods


DomainStorageServer.prototype = {
  start: start,
  setTrustedDomains: setTrustedDomains
};

var _default = new DomainStorageServer();

exports["default"] = _default;
module.exports = exports.default;