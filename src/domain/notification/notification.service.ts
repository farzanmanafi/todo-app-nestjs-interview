import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';

import { Notification, NotificationType } from './entities/notification.entity';
import { NotificationResponseDto } from './dto/notification-response.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Create a notification
   */
  async create(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    metadata?: any,
  ): Promise<NotificationResponseDto> {
    const notification = this.notificationRepository.create({
      userId,
      title,
      message,
      type,
      metadata,
      isRead: false,
    });

    const saved = await this.notificationRepository.save(notification);
    this.logger.log(`Notification created for user ${userId}: ${title}`);

    return new NotificationResponseDto(saved);
  }

  /**
   * Get all notifications for a user
   */
  async findAll(userId: string): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return notifications.map((n) => new NotificationResponseDto(n));
  }

  /**
   * Get unread notifications for a user
   */
  async findUnread(userId: string): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });

    return notifications.map((n) => new NotificationResponseDto(n));
  }

  /**
   * Mark notification as read
   */
  async markAsRead(
    id: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    notification.isRead = true;
    const updated = await this.notificationRepository.save(notification);

    return new NotificationResponseDto(updated);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ affected: number }> {
    const result = await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );

    this.logger.log(
      `Marked ${result.affected} notifications as read for user ${userId}`,
    );

    return { affected: result.affected || 0 };
  }

  /**
   * Delete a notification
   */
  async remove(id: string, userId: string): Promise<{ message: string }> {
    const result = await this.notificationRepository.delete({ id, userId });

    if (result.affected === 0) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    this.logger.log(`Notification deleted: ${id}`);

    return { message: 'Notification deleted successfully' };
  }

  /**
   * Send todo reminder notification
   */
  async sendTodoReminder(
    userId: string,
    todoTitle: string,
    todoId: string,
    dueDate: Date,
  ): Promise<NotificationResponseDto> {
    const hoursUntilDue = Math.round(
      (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60),
    );

    return this.create(
      userId,
      'Todo Reminder',
      `Your todo "${todoTitle}" is due in ${hoursUntilDue} hours`,
      NotificationType.TODO_REMINDER,
      { todoId, dueDate },
    );
  }

  /**
   * Event listener for todo creation
   */
  @OnEvent('todo.created')
  async handleTodoCreated(payload: {
    todoId: string;
    userId: string;
    dueDate?: Date;
  }): Promise<void> {
    if (payload.dueDate) {
      this.logger.log(
        `Todo created event received for todo ${payload.todoId} with due date`,
      );
      // Schedule notification will be handled by Bull Queue
    }
  }

  /**
   * Event listener for todo completion
   */
  @OnEvent('todo.updated')
  async handleTodoUpdated(payload: {
    todoId: string;
    userId: string;
    status: string;
  }): Promise<void> {
    if (payload.status === 'completed') {
      await this.create(
        payload.userId,
        'Todo Completed',
        'Congratulations! You completed a todo.',
        NotificationType.SYSTEM,
        { todoId: payload.todoId },
      );
    }
  }
}
