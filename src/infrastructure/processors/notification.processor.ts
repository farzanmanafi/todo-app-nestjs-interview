import {
  Process,
  Processor,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  QUEUE_NAMES,
  JOB_NAMES,
  TodoReminderJobData,
} from '../queue/queue.constants';
import { Todo } from '@domain/todo/entities/todo.entity';
import { TodoService } from '@domain/todo/todo-service';
import { NotificationService } from '@domain/notification/notification.service';

@Processor(QUEUE_NAMES.NOTIFICATION)
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly todoService: TodoService,
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
  ) {}

  @Process(JOB_NAMES.SEND_TODO_REMINDER)
  async handleTodoReminder(job: Job<TodoReminderJobData>): Promise<void> {
    this.logger.log(`Processing todo reminder job ${job.id}`);

    const { todoId, userId, title, dueDate } = job.data;

    try {
      // Check if todo still exists and is not completed
      const todo = await this.todoRepository.findOne({
        where: { id: todoId },
      });

      if (!todo) {
        this.logger.warn(`Todo ${todoId} not found, skipping notification`);
        return;
      }

      if (todo.status === 'completed') {
        this.logger.log(
          `Todo ${todoId} already completed, skipping notification`,
        );
        return;
      }

      if (todo.isNotificationSent) {
        this.logger.log(`Notification already sent for todo ${todoId}`);
        return;
      }

      // Send notification
      await this.notificationService.sendTodoReminder(
        userId,
        title,
        todoId,
        dueDate,
      );

      // Mark notification as sent
      await this.todoService.markNotificationSent(todoId);

      this.logger.log(`Todo reminder sent successfully for todo ${todoId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send todo reminder for todo ${todoId}`,
        error.stack,
      );
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job): void {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job): void {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Job ${job.id} failed with error: ${error.message}`,
      error.stack,
    );
  }
}
