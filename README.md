# websocket-reconnector

[![Build Status](https://travis-ci.com/autonomoussoftware/websocket-reconnector.svg?branch=master)](https://travis-ci.com/autonomoussoftware/websocket-reconnector) [![Greenkeeper badge](https://badges.greenkeeper.io/autonomoussoftware/websocket-reconnector.svg)](https://greenkeeper.io/)

A wrapper to W3C WebSocket objects to seamlesly add reconnection feature.

## Installation

```bash
$ npm install --save websocket-reconnector
```

## Usage

```js
const WebSocketReconnector = require('websocket-reconnector')

// Wrap any W3C WebSocket implementation
const ReconnectingWebSocket = WebSocketReconnector(WebSocket)

// Create your WebSocket client as usual and attach events
const client = ReconnectingWebsocket('ws://localhost')

// On connection and one every reconnection, send a message
client.onopen(() => client.send('Hello server'))

// A response is always received, no need to resubscribe to events
client.onmessage(event => console.log(`Message received: ${event.data}`))
```

### API

The API is fully compatible with the [W3C WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) API.

In addition, the following additional method is available:

#### `client.reconnect()`

Closes the underlying websocket instance and initiates a new connection.

## License

MIT
