import { ApiProperty } from '@nestjs/swagger';
import {
  Notification,
  NotificationType,
} from '../entities/notification.entity';

export class NotificationResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Todo Reminder' })
  title: string;

  @ApiProperty({ example: 'Your todo "Complete project" is due in 24 hours' })
  message: string;

  @ApiProperty({
    example: NotificationType.TODO_REMINDER,
    enum: NotificationType,
  })
  type: NotificationType;

  @ApiProperty({ example: false })
  isRead: boolean;

  @ApiProperty({
    example: {
      todoId: '123e4567-e89b-12d3-a456-426614174000',
      dueDate: '2024-12-31T23:59:59.000Z',
    },
    required: false,
  })
  metadata?: any;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  constructor(notification: Notification) {
    this.id = notification.id;
    this.title = notification.title;
    this.message = notification.message;
    this.type = notification.type;
    this.isRead = notification.isRead;
    this.metadata = notification.metadata;
    this.userId = notification.userId;
    this.createdAt = notification.createdAt;
    this.updatedAt = notification.updatedAt;
  }
}
