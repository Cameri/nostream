import { WebSocket } from 'ws'
import { Event } from '../../@types/event'
import { IEventStrategy } from '../../@types/message-handlers'
import { IEventRepository } from '../../@types/repositories'
import { IWebSocketServerAdapter } from '../../@types/servers'


export class DefaultEventStrategy implements IEventStrategy<[Event, WebSocket], Promise<boolean>> {
  public constructor(
    private readonly adapter: IWebSocketServerAdapter,
    private readonly eventRepository: IEventRepository,
  ) { }

  public async execute([event,]: [Event, WebSocket]): Promise<boolean> {
    try {
      const count = await this.eventRepository.create(event)
      if (!count) {
        return true
      }

      await this.adapter.broadcastEvent(event)

      return true
    } catch (error) {
      console.error('Unable to handle event. Reason:', error)

      return false
    }
  }

}
