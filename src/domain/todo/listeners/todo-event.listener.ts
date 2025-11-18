import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Todo } from '../entities/todo.entity';
import { User } from '../../users/entities/user.entity';
import { QueueService } from '@infrastructure/queue/queue.service';

interface TodoCreatedPayload {
  todoId: string;
  userId: string;
  dueDate?: Date;
}

interface TodoUpdatedPayload {
  todoId: string;
  userId: string;
  status: string;
}

interface TodoDeletedPayload {
  todoId: string;
  userId: string;
}

@Injectable()
export class TodoEventListener {
  private readonly logger = new Logger(TodoEventListener.name);

  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Handle todo.created event
   * Schedules reminder notification if todo has a due date
   */
  @OnEvent('todo.created')
  async handleTodoCreated(payload: TodoCreatedPayload): Promise<void> {
    this.logger.log(`Handling todo.created event for todo ${payload.todoId}`);

    const { todoId, userId, dueDate } = payload;

    if (dueDate) {
      try {
        // Get todo details
        const todo = await this.todoRepository.findOne({
          where: { id: todoId },
        });

        if (!todo) {
          this.logger.warn(`Todo ${todoId} not found`);
          return;
        }

        // Get user details
        const user = await this.userRepository.findOne({
          where: { id: userId },
        });

        if (!user) {
          this.logger.warn(`User ${userId} not found`);
          return;
        }

        // Schedule reminder notification
        await this.queueService.scheduleTodoReminder(
          todoId,
          userId,
          todo.title,
          dueDate,
          user.email,
          `${user.firstName} ${user.lastName}`,
        );

        this.logger.log(
          `Scheduled reminder for todo ${todoId} due on ${dueDate}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to schedule reminder for todo ${todoId}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Handle todo.updated event
   * Updates or cancels reminder notifications if needed
   */
  @OnEvent('todo.updated')
  async handleTodoUpdated(payload: TodoUpdatedPayload): Promise<void> {
    this.logger.log(`Handling todo.updated event for todo ${payload.todoId}`);

    const { todoId, status } = payload;

    try {
      // If todo is completed, cancel any scheduled reminder
      if (status === 'completed' || status === 'archived') {
        await this.queueService.cancelTodoReminder(todoId);
        this.logger.log(`Cancelled reminder for ${status} todo ${todoId}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle update for todo ${todoId}`,
        error.stack,
      );
    }
  }

  /**
   * Handle todo.deleted event
   * Cancels any scheduled reminders for the deleted todo
   */
  @OnEvent('todo.deleted')
  async handleTodoDeleted(payload: TodoDeletedPayload): Promise<void> {
    this.logger.log(`Handling todo.deleted event for todo ${payload.todoId}`);

    const { todoId } = payload;

    try {
      // Cancel any scheduled reminder
      await this.queueService.cancelTodoReminder(todoId);
      this.logger.log(`Cancelled reminder for deleted todo ${todoId}`);
    } catch (error) {
      this.logger.error(
        `Failed to cancel reminder for deleted todo ${todoId}`,
        error.stack,
      );
    }
  }

  /**
   * Handle todo.dueDate.updated event
   * Reschedules reminder notification if due date changed
   */
  @OnEvent('todo.dueDate.updated')
  async handleDueDateUpdated(payload: {
    todoId: string;
    userId: string;
    oldDueDate?: Date;
    newDueDate?: Date;
  }): Promise<void> {
    this.logger.log(
      `Handling todo.dueDate.updated event for todo ${payload.todoId}`,
    );

    const { todoId, userId, oldDueDate, newDueDate } = payload;

    try {
      // Cancel old reminder if it existed
      if (oldDueDate) {
        await this.queueService.cancelTodoReminder(todoId);
      }

      // Schedule new reminder if new due date exists
      if (newDueDate) {
        const todo = await this.todoRepository.findOne({
          where: { id: todoId },
        });

        const user = await this.userRepository.findOne({
          where: { id: userId },
        });

        if (todo && user) {
          await this.queueService.scheduleTodoReminder(
            todoId,
            userId,
            todo.title,
            newDueDate,
            user.email,
            `${user.firstName} ${user.lastName}`,
          );

          this.logger.log(
            `Rescheduled reminder for todo ${todoId} to ${newDueDate}`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to reschedule reminder for todo ${todoId}`,
        error.stack,
      );
    }
  }
}
