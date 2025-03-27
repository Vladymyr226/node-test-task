import { Controller, Get, Param, Query } from '@nestjs/common'
import { ChatService } from './chat.service'

@Controller('api')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('users/:userId/dialogs')
  async getUserDialogs(@Param('userId') userId: string, @Query('limit') limit = 10, @Query('offset') offset = 0) {
    return this.chatService.getUserDialogs(userId, +limit, +offset)
  }

  @Get('dialogs/:dialogId/messages')
  async getDialogMessages(
    @Param('dialogId') dialogId: string,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0
  ) {
    return this.chatService.getDialogMessages(dialogId, +limit, +offset)
  }

  @Get('users/:userId/analytics')
  async getUserAnalytics(@Param('userId') userId: string) {
    return this.chatService.getUserAnalytics(userId)
  }
}
