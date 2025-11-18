import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  QUEUE_NAMES,
  JOB_NAMES,
  JOB_PRIORITIES,
  TodoReminderJobData,
} from './queue.constants';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.NOTIFICATION)
    private readonly notificationQueue: Queue,
  ) {}

  /**
   * Schedule a todo reminder notification
   * Sends notification 24 hours before due date
   */
  async scheduleTodoReminder(
    todoId: string,
    userId: string,
    title: string,
    dueDate: Date,
    userEmail: string,
    userName: string,
  ): Promise<void> {
    // Calculate when to send notification (24 hours before due date)
    const notificationTime = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);
    const now = new Date();

    // Only schedule if notification time is in the future
    if (notificationTime <= now) {
      this.logger.warn(
        `Todo ${todoId} due date is less than 24 hours away, skipping reminder schedule`,
      );
      return;
    }

    const delay = notificationTime.getTime() - now.getTime();

    try {
      const job = await this.notificationQueue.add(
        JOB_NAMES.SEND_TODO_REMINDER,
        {
          todoId,
          userId,
          title,
          dueDate,
          userEmail,
          userName,
        } as TodoReminderJobData,
        {
          delay,
          jobId: `reminder-${todoId}`, // Unique job ID to prevent duplicates
          priority: JOB_PRIORITIES.HIGH,
          removeOnComplete: true,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );

      this.logger.log(
        `Scheduled todo reminder for todo ${todoId} at ${notificationTime.toISOString()}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to schedule todo reminder for todo ${todoId}`,
        error.stack,
      );
    }
  }

  /**
   * Cancel a scheduled todo reminder
   */
  async cancelTodoReminder(todoId: string): Promise<void> {
    try {
      const job = await this.notificationQueue.getJob(`reminder-${todoId}`);
      if (job) {
        await job.remove();
        this.logger.log(`Cancelled todo reminder for todo ${todoId}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to cancel todo reminder for todo ${todoId}`,
        error.stack,
      );
    }
  }

  /**
   * Get notification queue health status
   */
  async getNotificationQueueHealth(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.notificationQueue.getWaitingCount(),
      this.notificationQueue.getActiveCount(),
      this.notificationQueue.getCompletedCount(),
      this.notificationQueue.getFailedCount(),
      this.notificationQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Get all queues health status
   */
  async getAllQueuesHealth(): Promise<any> {
    const notificationHealth = await this.getNotificationQueueHealth();

    return {
      notification: notificationHealth,
      timestamp: new Date().toISOString(),
    };
  }
}
