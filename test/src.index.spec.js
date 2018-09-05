'use strict'

const chai = require('chai')
const http = require('http')
const W3CWebSocket = require('websocket').w3cwebsocket
const WebSocketServer = require('websocket').server

chai.should()

const WebSocketReconnector = require('..')

describe('Standard W3C API', function () {
  it('should connect, echo and disconnect', function (done) {
    const server = http.createServer(function (request, response) {
      response.writeHead(404)
      response.end()
    })
    const wsServer = new WebSocketServer({
      httpServer: server,
      autoAcceptConnections: true
    })
    wsServer.on('connect', function (connection) {
      connection.on('message', function (message) {
        message.utf8Data.should.equal('ping')
        connection.sendUTF('pong')
      })
      connection.on('close', function (code) {
        code.should.equal(1000)
        wsServer.shutDown()
        server.close()
      })
    })
    server.listen(0, function () {
      const ReconnectingWebSocket = WebSocketReconnector(W3CWebSocket)
      const port = server.address().port
      const client = new ReconnectingWebSocket(`ws://localhost:${port}/`)
      client.onopen = function (event) {
        event.type.should.equal('open')
        client.readyState.should.equal(client.OPEN)
        client.send('ping')
      }
      client.onmessage = function (event) {
        event.data.should.equal('pong')
        client.close()
      }
      client.onerror = function () {
        done(new Error('Connection Error'))
      }
      client.onclose = function (event) {
        event.type.should.equal('close')
        event.code.should.equal(1000)
        done()
      }
    })
  })

  it('should connect, fail, reconnect and disconnect', function (done) {
    const server = http.createServer(function (request, response) {
      response.writeHead(404)
      response.end()
    })
    const wsServer = new WebSocketServer({
      httpServer: server,
      autoAcceptConnections: true
    })
    wsServer.on('connect', function (connection) {
      connection.on('close', function (code) {
        code.should.equal(1000)
        wsServer.shutDown()
        server.close()
      })
    })
    server.listen(0, function () {
      const port = server.address().port
      server.close(function () {
        const ReconnectingWebSocket = WebSocketReconnector(W3CWebSocket, {
          reconnectDelay: 100
        })
        const client = new ReconnectingWebSocket(`ws://localhost:${port}/`)
        client.addEventListener('open', function (event) {
          event.type.should.equal('open')
          client.close()
        })
        client.addEventListener('error', function (event) {
          event.type.should.equal('error')
          server.listen(port)
        })
        client.addEventListener('close', function (event) {
          event.code.should.equal(1000)
          done()
        })
      })
    })
  })

  it.skip('should connect, send, error, reconnect', function (done) {
    const server = http.createServer(function (request, response) {
      response.writeHead(404)
      response.end()
    })
    const wsServer = new WebSocketServer({
      httpServer: server,
      autoAcceptConnections: true
    })
    wsServer.on('connect', function (connection) {
      connection.on('close', function (code) {
        code.should.equal(1000)
        wsServer.shutDown()
        server.close()
      })
      connection.on('message', function (message) {
        message.utf8Data.should.equal('ping')
        connection.sendUTF('pong')
      })
    })
    server.listen(0, function () {
      const ReconnectingWebSocket = WebSocketReconnector(W3CWebSocket, {
        reconnectDelay: 100
      })
      const port = server.address().port
      const client = new ReconnectingWebSocket(`ws://localhost:${port}/`)
      client.onopen = function (event) {
        event.type.should.equal('open')
        server.close(function () {
          // TOFIX server never closes because the ws client is still connected
          server.listening.should.equal(false)
          client.send('ping')
        })
      }
      client.onmessage = function (event) {
        event.data.should.equal('pong')
        client.close()
      }
      client.onerror = function (event) {
        event.type.should.equal('error')
        server.listen(port)
      }
      client.onclose = function (event) {
        event.code.should.equal(1000)
        done()
      }
    })
  })
})
