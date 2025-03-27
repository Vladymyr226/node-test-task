import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { Server, WebSocket, RawData } from 'ws'
import { ChatService } from './chat.service'
import { Logger, ValidationPipe } from '@nestjs/common'
import { plainToClass } from 'class-transformer'
import { MessageDto } from './dto/message.dto'
import { Message } from './interfaces/message.interface'

@WebSocketGateway()
export class ChatGateway {
  @WebSocketServer() server: Server
  private logger = new Logger('ChatGateway')
  private ws: WebSocket
  private reconnectAttempts = 0
  private readonly maxReconnectAttempts = 5
  private readonly reconnectInterval = 2000
  private readonly validationPipe = new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  })

  constructor(private readonly chatService: ChatService) {
    this.connectToExternalService()
  }

  connectToExternalService() {
    this.ws = new WebSocket(process.env.WS_URL)

    this.ws.on('open', () => {
      this.logger.log('Connected to external WebSocket service')
      this.reconnectAttempts = 0
    })

    this.ws.on('message', async (data: RawData) => {
      const message = JSON.parse(data.toString())
      if (message.type === 'NEW_MESSAGE') {
        const messageDto = plainToClass(MessageDto, message.payload)
        await this.validationPipe.transform(messageDto, {
          type: 'body',
          metatype: MessageDto,
        })
        const payload: Message = {
          ...messageDto,
        }
        this.chatService.handleNewMessage(payload)
      }
    })

    this.ws.on('close', (code: number, reason: Buffer) => {
      this.logger.warn(`WebSocket connection closed. Code: ${code}, Reason: ${reason.toString()}`)
      this.handleReconnection()
    })

    this.ws.on('error', (error: Error) => {
      this.logger.error('WebSocket error:', error.message)
    })
  }

  handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        this.logger.log(`Reconnection attempt ${this.reconnectAttempts}`)
        this.connectToExternalService()
      }, this.reconnectInterval * this.reconnectAttempts)
    } else {
      this.logger.error('Max reconnection attempts reached')
    }
  }
}
