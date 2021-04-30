/**
 * DomainStorageServer library
 * Provides a mechanism to share local storage between a parent domain and subdomains
 */
let _this,
  _referrerOrigin

// DomainStorageServer constructor
const DomainStorageServer = function () {
  // Ensure singleton instance
  if (_this !== undefined) {
    return _this
  }

  _referrerOrigin = (new URL(document.referrer)).origin

  // Check for support
  if (!window || !window.postMessage) {
    console.error('Missing feature support. Exiting!')
    return
  }

  // todo initialize a listener that listens, takes action, and responds with another message
  // Save a reference to this
  _this = this

  // Listen to messages
  window.addEventListener('message', (event) => {
    if (
      !isMessageTrusted(event.origin) || // Message is from somewhere else
      event.data.type !== 'domain_storage_msg' // Message is not related to domain storage
    ) return

    const { action, actionId, ...props } = event.data

    // Respond with actionId, success, response
    handleActionRequest(action, actionId, props)
  }, false)

  window.top.postMessage({
    type: 'domain_storage_msg',
    ready: true
  }, _referrerOrigin)

  return _this
}

const isMessageTrusted = (origin) => {
  return (new URL(origin)).hostname.endsWith(window.location.hostname)
}

const handleActionRequest = (action, actionId, props) => {
  switch (action) {
    case 'getItem':
      return respond(actionId, true, localStorage.getItem(props.key))
    case 'setItem':
      return respond(actionId, true, localStorage.setItem(props.key, props.value))
    case 'removeItem':
      return respond(actionId, true, localStorage.removeItem(props.key))
    default:
      return respond(actionId, false, new Error('Invalid action request'))
  }
}

const respond = (actionId, success, response) => {
  window.top.postMessage({
    type: 'domain_storage_msg',
    actionId,
    success,
    response
  }, _referrerOrigin)
}

// Instance methods
DomainStorageServer.prototype = {
  // Add exposed functions here e.g.
  // exampleFunc: () => console.log("exampleFunc called"),
}

export default (new DomainStorageServer())
