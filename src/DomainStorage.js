/**
 * DomainStorage library
 * Provides a client to use with subdomain to access the shared local storage from parent domain through DomainStorage
 */

const { v4: uuidv4 } = require('uuid')

let _this
let _serverUrl
let _iframe
let _whenServerReady
let _timeout = 10000
const _pendingActions = {}

// DomainStorage constructor
const DomainStorage = function () {
  // Ensure singleton instance
  if (_this !== undefined) {
    return _this
  }
  // Check for support
  if (!window || !window.postMessage) {
    console.error('Missing feature support. Exiting!')
    return
  }

  // Save a reference to this
  _this = this

  // If env var is set, set server URL
  if (typeof process !== 'undefined' && process.env.DOMAIN_STORATE_HOST) {
    setServerUrl(process.env.DOMAIN_STORATE_HOST)
  }

  // Init response event listener from server
  window.addEventListener('message', (event) => {
    if (
      !isMessageTrusted(event.origin) || // Message is from somewhere else
      event.data.type !== 'domain_storage_msg' // Message is not related to domain storage
    ) return

    if (event.data.actionId) { // Got response for an action request
      const { actionId, success, response } = event.data

      if (_pendingActions[actionId] === undefined) return // Unexpected

      const [resolve, reject] = _pendingActions[actionId]

      // Delete pending action
      delete _pendingActions[actionId];

      // Respond according to status
      (success ? resolve : reject)(response)
    }
  }, false)

  return _this
}

const isMessageTrusted = (origin) => {
  return _serverUrl && origin === (new URL(_serverUrl)).origin
}

const getItem = (key) => {
  return requestAction('getItem', { key })
}

const setItem = (key, value) => {
  return requestAction('setItem', { key, value: value })
}

const removeItem = (key) => {
  return requestAction('removeItem', { key })
}

const requestAction = (action, props) => {
  if (_whenServerReady === undefined) {
    return Promise.reject(new Error('Server URL not set'))
  }

  return _whenServerReady.then(() => {
    // Start a timeout to reject promise
    let timeoutRef

    return (new Promise((resolve, reject) => {
      const actionId = uuidv4()

      // Save to be resolved or rejected at response
      _pendingActions[actionId] = [resolve, reject]

      // Timeout to reject the promise if not fulfilled on time
      timeoutRef = setTimeout(() => {
        reject(new Error('Operation timed out'))
        delete _pendingActions[actionId]
      }, _timeout)

      // Post message to host
      _iframe.contentWindow.postMessage({
        type: 'domain_storage_msg',
        action,
        actionId,
        ...props
      }, _serverUrl)
    })).finally(() => {
      clearTimeout(timeoutRef)
    })
  })
}

const setServerUrl = url => {
  if (typeof url !== 'string') {
    throw new Error('Host must be a string')
  }
  _serverUrl = url
  initIframe()
}

const setFailTimeout = timeout => {
  if (typeof timeout !== 'number') {
    throw new Error('Timeout must be a number')
  }
  _timeout = timeout
}

const initIframe = () => {
  if (_iframe === undefined) {
    _iframe = window.document.createElement('iframe')

    // todo change to hidden
    _iframe.style.display = 'none'
    _iframe.width = '0'
    _iframe.height = '0'
    _iframe.src = _serverUrl

    window.document.body.appendChild(_iframe)
  }

  let timeoutRef, serverReadyListener

  // Recreate the promise on every iframe src change
  _whenServerReady = (new Promise((resolve, reject) => {
    // Timeout to reject the promise if not fulfilled on time
    timeoutRef = setTimeout(() => reject(new Error('Server connection timed out')), _timeout)

    // Server ready listener - for removing it in finally
    serverReadyListener = (event) => {
      if (
        !isMessageTrusted(event.origin) || // Message is from somewhere else
        event.data.type !== 'domain_storage_msg' // Message is not related to domain storage
      ) return

      if (event.data.ready) { // Resolve when ready message is received
        clearTimeout(timeoutRef)
        resolve()
      }
    }

    // Listen to iframe ready message
    window.addEventListener('message', serverReadyListener, false)
  })).finally(() => {
    clearTimeout(timeoutRef)
    window.removeEventListener('message', serverReadyListener)
  })

  _iframe.src = _serverUrl
}

// Instance methods
DomainStorage.prototype = {
  setServerUrl,
  setFailTimeout,
  getItem,
  setItem,
  removeItem
}

export default (new DomainStorage())
