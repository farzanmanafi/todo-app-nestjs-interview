import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
import { FindAllNotificationsDec } from './decorators/find-all-notification.decorator';
import { FindUnreadNotificationsDec } from './decorators/find-Unread-notification.decorator';
import { MarkAsReadDec } from './decorators/mark-as-read.decorator';
import { MarkAllAsReadDec } from './decorators/mark-all-as-read.decorator';
import { RemoveNotificationDec } from './decorators/remove-notification.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @FindAllNotificationsDec()
  findAll(@GetUser() user: User) {
    return this.notificationService.findAll(user.id);
  }

  @Get('unread')
  @FindUnreadNotificationsDec()
  findUnread(@GetUser() user: User) {
    return this.notificationService.findUnread(user.id);
  }

  @Patch(':id/read')
  @MarkAsReadDec()
  markAsRead(@Param('id') id: string, @GetUser() user: User) {
    return this.notificationService.markAsRead(id, user.id);
  }

  @Patch('read-all')
  @MarkAllAsReadDec()
  markAllAsRead(@GetUser() user: User) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @RemoveNotificationDec()
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.notificationService.remove(id, user.id);
  }
}
