'use strict'

function WsReconnector (Ws, options) {
  function ReconnectingWebsocket (...args) {
    const readOnlyProperties = [
      'CONNECTING',
      'OPEN',
      'CLOSING',
      'CLOSED',
      'bufferedAmount',
      'extensions',
      'protocol',
      'readyState',
      'url'
    ]

    readOnlyProperties.forEach(property =>
      Object.defineProperty(this, property, {
        get () {
          return this._ws[property]
        }
      })
    )

    Object.defineProperty(this, 'binaryType', {
      get () {
        return this._ws.binaryType
      },
      set (type) {
        this._ws.binaryType = type
      }
    })

    this._listeners = {}
    this._dummyListeners = {}

    const events = [
      'open',
      'message',
      'error',
      'close'
    ]

    events
      .map(event => `on${event}`)
      .forEach(prop =>
        Object.defineProperty(this, prop, {
          get () {
            return this._ws[prop]
          },
          set (listener) {
            this._dummyListeners[prop] = listener
          }
        })
      )

    this._args = args

    this._options = {
      keepAlive: 30000,
      reconnectDelay: 5000
    }

    for (const option in options) {
      this._options[option] = options[option]
    }

    this._connecting = false
    this._connected = false

    this._connect()
  }

  ReconnectingWebsocket.prototype._connect = function () {
    if (this._connecting || this._connected) {
      return
    }

    this._connecting = true

    this._ws = new Ws(...this._args)

    this._ws.onopen = event => {
      if (event.target._connection && event.target._connection.socket) {
        const socket = event.target._connection.socket
        socket.setKeepAlive(true, this._options.keepAlive)
      }

      this._connecting = false
      this._connected = true

      if (this._dummyListeners.onopen) {
        this._dummyListeners.onopen.call(this, event)
      }

      if (this._listeners.open) {
        this._listeners.open.forEach(listener => listener.call(this, event))
      }
    }

    this._ws.onmessage = event => {
      if (this._dummyListeners.onmessage) {
        this._dummyListeners.onmessage.call(this, event)
      }

      if (this._listeners.message) {
        this._listeners.message.forEach(listener => listener.call(this, event))
      }
    }

    this._ws.onerror = event => {
      if (event.code === 'ECONNREFUSED') {
        this._reconnect()
        return
      }

      if (this._dummyListeners.onerror) {
        this._dummyListeners.onerror.call(this, event)
      }

      if (this._listeners.error) {
        this._listeners.error.forEach(listener => listener.call(this, event))
      }
    }

    this._ws.onclose = event => {
      this._connecting = false
      this._connected = false

      if (event.code !== 1000) {
        this._reconnect()
        return
      }

      if (this._dummyListeners.onclose) {
        this._dummyListeners.onclose.call(this, event)
      }

      if (this._listeners.close) {
        this._listeners.close.forEach(listener => listener.call(this, event))
      }
    }
  }

  ReconnectingWebsocket.prototype._reconnect = function () {
    setTimeout(
      () => this._connect(),
      this._options.reconnectDelay
    )
  }

  ReconnectingWebsocket.prototype.send = function (data) {
    return this._ws.send(data)
  }

  ReconnectingWebsocket.prototype.close = function () {
    return this._ws.close()
  }

  ReconnectingWebsocket.prototype.addEventListener = function (type, listener) {
    if (!type || !listener) {
      return
    }

    this._listeners[type] = this._listeners[type] || []
    this._listeners[type].push(listener)
  }

  ReconnectingWebsocket.prototype.removeEventListener = function (type, listener) {
    if (!type || !listener || !this._listeners[type]) {
      return
    }

    const i = this._listeners[type].indexOf(listener)
    if (i !== -1) {
      this._listeners[type].splice(i, 1)
    }
  }

  ReconnectingWebsocket.prototype.dispatchEvent = function (event) {
    this._ws.dispatchEvent(event)
  }

  return ReconnectingWebsocket
}

module.exports = WsReconnector
