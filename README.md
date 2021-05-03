# domain-storage

Provides a mechanism to share parent domain's localStorage with subdomains using an iframe and postMessage API.

Browser's local storage API (localStorage) is a very handy tool, and for obvious security reasons it is not shared with
any domain different from the target domain. But if you want to be able to share a storage between subdomains, then this
small utility can be handy.

The use cases for such a feature would include single-sign-on mechanism, or a shared shopping cart among different
subdomains of a store, etc.

__Note: This package should only be used in a setting where all sobdomains are absolutely trusted by the parent domain.
Every subdomain can read all data written by this package to the parent domain. If one or more of the subdomains are not
trustworthy, then this package should not be used.__

## Setup

The setup requeres steps on both parent domain (to host the server library) and subdomains.

### Parent / Super Domain

1. Install the package with npm
    ```shell
    npm install adeelnawaz/domain-storage
    ```
1. Create a page that loads the `DomainStorageServer` module. This can be done on any page (e.g. homepage, etc) but it
   is recommended to add a dedicated route that renders an empty page with only `DomainStorageServer` module loaded.
   This will ensure smaller page size and faster load times, since this page will be loaded along with all pages of the
   subdomains.

The `DomainStorageServer` module can be loaded as ES module

```js
// ES6
import { DomainStorageServer } from "domain-storage"

// ES5
const { DomainStorageServer } = require("domain-storage")
```

or using a script tag (you will have to copy dist directory to your public directory using npm build script or manually)

```html
<!-- Unminified -->
<script src="dist/DomainStorageServer.js"></script>

<!-- Minified -->
<script src="dist/DomainStorageServer.min.js"></script>

<!-- As ES6 Module -->
<script type="module" src="dist/DomainStorageServer.js"></script>
```

When loaded, the module will start to entertain the storage read / write requests posted by subdomains (from top window)
.

### Subdomains

1. Install the package with npm
    ```shell
    npm install adeelnawaz/domain-storage
    ```
1. Use the `DomainStorage` module to read / write to shared domain storage

The `DomainStorage` module can be loaded for usage as ES module

```js
// ES6
import { DomainStorage } from "domain-storage"

// ES5
const { DomainStorage } = require("domain-storage")
```

or using a script tag

```html
<!-- Unminified -->
<script src="dist/DomainStorage.js"></script>

<!-- Minified -->
<script src="dist/DomainStorage.min.js"></script>

<!-- As ES6 Module -->
<script type="module" src="dist/DomainStorage.js"></script>
```

When loaded using a script tag (without `type="module"`), the module will expose a `window.DomainStorage` object.

## Usage

The `DomainStorage` module exposes the following functions
```ts
class DomainStorage {
   setServerUrl: (url: string) => undefined
   setFailTimeout: (timeout: number) => undefined
   getItem: (key: string) => Promise<string|null>
   setItem: (key: string, value: string) => Promise<undefined>
   removeItem: (key: string) => Promise<undefined>
}
```

Once set up, the domain storage client needs to be provided with domain storage server's URL before it can be used. This
URL is the absolute path of the parent / super domain's page that has the `DomainStorageServer` module loaded.

```js
// On https://sub.example.com/
DomainStorage.setServerUrl('https://www.example.com/domain-storage')
```

After that, it can be used to read and write from shared domain storage
```js
// Write
DomainStorage.setItem('someItem', 'someValue').then(() => console.log('someItem is set'))

// Read
DomainStorage.getItem('someItem').then(res => console.log('someItem is', res))

// Remove
DomainStorage.removeItem('someItem').then(() => console.log('someItem is removed'))
```

## Under the Hood
The science behind this functionality is a mix of a hidden iframe, JavaScript `postMessage` API, and JavaScript `localStorage` API. The workings of it are as follows:
- The `DomainStorage` constructor initializes a `window.message` event listener to receive the responses of the operations requested from the server (more on this later)
- When the server URL is set for the `DomainStorage` module, it adds a hidden iframe inside the document with src set to server URL. It also initializes a promise internally, which is resolved once the iframe announces that it is ready
- Inside the iframe, the `DomainStorageServer` module initializes a `window.message` event listener to monitor the messages posted by top window. Once the message listener is initialized, it posts a message to top window to announce that it is ready to entertain the requests
- When any of the `DomainStorage` (get / set / remove) functions is called, it generates a promise. Inside the promise executor, it stores the `resolve` and `reject` functions of the promise in a hashmap against a unique UUID. Then it posts a message to the iframe with that UUID, the operation name, and the data (e.g. key, value, etc). After posting the message, it returns the promise to the function caller
- When the `DomainStorageServer`'s listener receives the event, it takes the requested actions (get / set/ remove item) against the `localStorage` and posts a message to the top window with the UUID from the message received, the status of the request (success / failure), and the result of the requested operation
- This message is received by the listener initialized by `DomainStorage` constructor. This constructor then gets the promise from the hashmap of promises using the UUID, and resolves or rejects the promise according to the status of the response message

__Note:__
- After adding the iframe when the server URL is set, the `DomainStorage` module starts a timeout. If the "ready" indication is not received from the iframe within that timeout, then the ready promise is rejected. Which means that all requested operations (get / set / remove item) will return a rejected promise
- After requesting an action, the `DomainStorage` module starts a timeout. If the response to the operation is not received within that timeout, the promise is rejected
- The time for both of these timeouts is 10000 milliseconds by default and can be changed by calling `DomainStorage.setFailTimeout` function
- If an operation is requested before the server URL is set, it will return an already rejected promise with the following error `Server URL not set`

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
