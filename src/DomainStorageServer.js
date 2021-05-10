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

  // Check for support
  if (!window || !window.postMessage) {
    console.error('Missing feature support. Exiting!')
    return
  }
  // Check for referrer
  if (!document.referrer) {
    console.error('No referrer found')
    return
  }

  _referrerOrigin = (new URL(document.referrer)).origin

  // todo initialize a listener that listens, takes action, and responds with another message
  // Save a reference to this
  _this = this

  return _this
}

const start = () => {
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
}

const getParentDomain = hostname => {
  return hostname.split('.').slice(-2).join('.')
}

const isMessageTrusted = (origin) => {
  // todo also verify the source of the message
  return getParentDomain((new URL(origin)).hostname) === getParentDomain(window.location.hostname)
}

const handleActionRequest = (action, actionId, props) => {
  const key = `DomainStorage::${props.key}`

  switch (action) {
    case 'getItem':
      return respond(actionId, true, localStorage.getItem(key))
    case 'setItem':
      return respond(actionId, true, localStorage.setItem(key, props.value))
    case 'removeItem':
      return respond(actionId, true, localStorage.removeItem(key))
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
  start
}

export default (new DomainStorageServer())
