import { Injectable, Logger } from '@nestjs/common'
import { Message } from './interfaces/message.interface'
import { DatabaseService } from '../database/database.service'

@Injectable()
export class ChatService {
  private readonly logger = new Logger('ChatService')
  private messageCache: Map<string, Message> = new Map()
  private readonly cacheTTL = 60 * 60 * 1000
  private missedMessagesCount: Map<string, number> = new Map() // Missed messages counter by dialogId
  private lastReceivedTimestamp: Map<string, bigint> = new Map() // The latest timestamp for each dialogId

  constructor(private readonly dbService: DatabaseService) {}

  async handleNewMessage(payload: Message) {
    if (this.messageCache.has(payload.id)) {
      this.logger.warn(`Duplicate message detected: ${payload.id}`)
      return
    }

    const lastTimestamp = this.lastReceivedTimestamp.get(payload.dialogId) || 0
    if (lastTimestamp > payload.createdAt) {
      this.logger.warn(
        `Message out of order in dialog ${payload.dialogId}: received message with createdAt ${payload.createdAt} after ${lastTimestamp}`
      )
    }
    this.lastReceivedTimestamp.set(payload.dialogId, payload.createdAt)

    this.messageCache.set(payload.id, payload)

    setTimeout(() => {
      this.messageCache.delete(payload.id)
    }, this.cacheTTL)

    try {
      await this.dbService.getKnex().table('messages').insert(payload)
      this.logger.log(`Message saved: ${payload.id}`)
      await this.checkMessageConsistency(payload.dialogId)
    } catch (error) {
      this.logger.error('Error saving message:', error)
    }
  }

  private async checkMessageConsistency(dialogId: string) {
    const messages = await this.dbService
      .getKnex()
      .table('messages')
      .where('dialogId', dialogId)
      .orderBy('createdAt', 'asc')

    for (let i = 1; i < messages.length; i++) {
      const prev = messages[i - 1]
      const curr = messages[i]
      if (curr.createdAt - prev.createdAt > 10000) {
        this.logger.warn(
          `Potential missing message in dialog ${dialogId} between ${prev.id} (createdAt: ${prev.createdAt}) and ${curr.id} (createdAt: ${curr.createdAt})`
        )
        const currentCount = this.missedMessagesCount.get(dialogId) || 0
        this.missedMessagesCount.set(dialogId, currentCount + 1)
      }
    }
  }

  async getUserDialogs(userId: string, limit: number, offset: number) {
    const dialogs = await this.dbService
      .getKnex()
      .select('dialogId')
      .from('messages')
      .where('senderId', userId)
      .distinct()
      .limit(limit)
      .offset(offset)

    const result = await Promise.all(
      dialogs.map(async dialog => {
        const lastMessage = await this.dbService
          .getKnex()
          .table('messages')
          .where('dialogId', dialog.dialogId)
          .orderBy('createdAt', 'desc')
          .first()

        return {
          dialogId: dialog.dialogId,
          lastMessage,
          participants: [userId],
        }
      })
    )

    return result
  }

  async getDialogMessages(dialogId: string, limit: number, offset: number) {
    return this.dbService
      .getKnex()
      .table('messages')
      .where('dialogId', dialogId)
      .orderBy('createdAt', 'asc')
      .limit(limit)
      .offset(offset)
  }

  async getUserAnalytics(userId: string) {
    const dialogs = await this.dbService
      .getKnex()
      .select('dialogId')
      .from('messages')
      .where('senderId', userId)
      .distinct()

    const totalDialogs = dialogs.length
    const totalMessages = await this.dbService
      .getKnex()
      .table('messages')
      .where('senderId', userId)
      .count('id as count')
      .first()

    const messagesPerDialog = await this.dbService
      .getKnex()
      .select('dialogId')
      .count('id as count')
      .from('messages')
      .where('senderId', userId)
      .groupBy('dialogId')

    const responseTimes = await this.dbService
      .getKnex()
      .select('createdAt')
      .from('messages')
      .where('senderId', userId)
      .orderBy('createdAt', 'asc')

    const medianResponseTime = this.calculateMedianResponseTime(responseTimes)

    const missedMessagesPerDialog = Array.from(this.missedMessagesCount.entries())
      .filter(([dialogId]) => dialogs.some(d => d.id === dialogId))
      .map(([dialogId, count]) => ({ dialogId: dialogId, missedCount: count }))

    return {
      totalDialogs,
      totalMessages: totalMessages.count,
      messagesPerDialog,
      medianResponseTime,
      missedMessagesPerDialog,
    }
  }

  private calculateMedianResponseTime(messages: { createdAt: number }[]): number {
    if (messages.length < 2) return 0

    const diffs = []
    for (let i = 1; i < messages.length; i++) {
      diffs.push(messages[i].createdAt - messages[i - 1].createdAt)
    }

    diffs.sort((a, b) => a - b)
    const mid = Math.floor(diffs.length / 2)
    return diffs.length % 2 === 0 ? (diffs[mid - 1] + diffs[mid]) / 2 : diffs[mid]
  }
}
