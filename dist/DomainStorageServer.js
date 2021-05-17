(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("DomainStorageServer", [], factory);
	else if(typeof exports === 'object')
		exports["DomainStorageServer"] = factory();
	else
		root["DomainStorageServer"] = factory();
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!************************************!*\
  !*** ./src/DomainStorageServer.js ***!
  \************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

/**
 * DomainStorageServer library
 * Provides a mechanism to share local storage between a parent domain and subdomains
 */
var _this, _referrerOrigin; // DomainStorageServer constructor


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
  // todo also verify the source of the message
  return getParentDomain(new URL(origin).hostname) === getParentDomain(window.location.hostname);
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
}; // Instance methods


DomainStorageServer.prototype = {
  start: start
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (new DomainStorageServer());
__webpack_exports__ = __webpack_exports__.default;
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=DomainStorageServer.js.map