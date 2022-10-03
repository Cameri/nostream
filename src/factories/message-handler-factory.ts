import { IncomingMessage, MessageType } from '../@types/messages'
import { EventMessageHandler } from '../handlers/event-message-handler'
import { eventStrategyFactory } from './event-strategy-factory'
import { IEventRepository } from '../@types/repositories'
import { IWebSocketAdapter } from '../@types/adapters'
import { Settings } from '../utils/settings'
import { SubscribeMessageHandler } from '../handlers/subscribe-message-handler'
import { UnsubscribeMessageHandler } from '../handlers/unsubscribe-message-handler'

export const messageHandlerFactory = (
  eventRepository: IEventRepository,
) => ([message, adapter]: [IncomingMessage, IWebSocketAdapter]) => {
  switch (message[0]) {
    case MessageType.EVENT:
      return new EventMessageHandler(adapter, eventStrategyFactory(eventRepository), Settings)
    case MessageType.REQ:
      return new SubscribeMessageHandler(adapter, eventRepository)
    case MessageType.CLOSE:
      return new UnsubscribeMessageHandler(adapter,)
    default:
      throw new Error(`Unknown message type: ${String(message[0])}`)
  }
}