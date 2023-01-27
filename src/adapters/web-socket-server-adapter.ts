import { IncomingMessage, Server } from 'http'
import WebSocket, { OPEN, WebSocketServer } from 'ws'
import { propEq } from 'ramda'

import { IWebSocketAdapter, IWebSocketServerAdapter } from '../@types/adapters'
import { WebSocketAdapterEvent, WebSocketServerAdapterEvent } from '../constants/adapter'
import { createLogger } from '../factories/logger-factory'
import { Event } from '../@types/event'
import { Factory } from '../@types/base'
import { getRemoteAddress } from '../utils/http'
import { isRateLimited } from '../handlers/request-handlers/rate-limiter-middleware'
import { Settings } from '../@types/settings'
import { WebServerAdapter } from './web-server-adapter'

const debug = createLogger('web-socket-server-adapter')

const WSS_CLIENT_HEALTH_PROBE_INTERVAL = 30000

export class WebSocketServerAdapter extends WebServerAdapter implements IWebSocketServerAdapter {
  private webSocketsAdapters: WeakMap<WebSocket, IWebSocketAdapter>

  private heartbeatInterval: NodeJS.Timer

  public constructor(
    webServer: Server,
    private readonly webSocketServer: WebSocketServer,
    private readonly createWebSocketAdapter: Factory<
      IWebSocketAdapter,
      [WebSocket, IncomingMessage, IWebSocketServerAdapter]
    >,
    private readonly settings: () => Settings,
  ) {
    super(webServer)

    this.webSocketsAdapters = new WeakMap()

    this
      .on(WebSocketServerAdapterEvent.Broadcast, this.onBroadcast.bind(this))

    this.webSocketServer
      .on(WebSocketServerAdapterEvent.Close, this.onClose.bind(this))
      .on(WebSocketServerAdapterEvent.Connection, this.onConnection.bind(this))
      .on('error', (error) => {
        debug('error: %o', error)
      })
    this.heartbeatInterval = setInterval(this.onHeartbeat.bind(this), WSS_CLIENT_HEALTH_PROBE_INTERVAL)
  }

  public close(callback: () => void): void {
    this.onClose()
    this.webSocketServer.close(() => {
      this.webServer.close(callback)
    })
  }

  private onBroadcast(event: Event) {
    this.webSocketServer.clients.forEach((webSocket: WebSocket) => {
      if (!propEq('readyState', OPEN)(webSocket)) {
        return
      }
      const webSocketAdapter = this.webSocketsAdapters.get(webSocket) as IWebSocketAdapter
      webSocketAdapter.emit(WebSocketAdapterEvent.Event, event)
    })
  }

  public getConnectedClients(): number {
    return Array.from(this.webSocketServer.clients).filter(propEq('readyState', OPEN)).length
  }

  private async onConnection(client: WebSocket, req: IncomingMessage) {
    const currentSettings = this.settings()
    const remoteAddress = getRemoteAddress(req, currentSettings)

    debug('client %s connected: %o', remoteAddress, req.headers)

    if (await isRateLimited(remoteAddress, currentSettings)) {
      debug('client %s terminated: rate-limited', remoteAddress)
      client.terminate()
      return
    }

    this.webSocketsAdapters.set(client, this.createWebSocketAdapter([client, req, this]))
  }

  private onHeartbeat() {
    this.webSocketServer.clients.forEach((webSocket) => {
      const webSocketAdapter = this.webSocketsAdapters.get(webSocket) as IWebSocketAdapter
      webSocketAdapter.emit(WebSocketAdapterEvent.Heartbeat)
    })
  }

  protected onClose() {
    debug('closing')
    clearInterval(this.heartbeatInterval)
    this.webSocketServer.clients.forEach((webSocket: WebSocket) => {
      debug('terminating client')
      webSocket.terminate()
    })
    this.removeAllListeners()
    this.webSocketServer.removeAllListeners()
    super.onClose()
    debug('closed')
  }
}
