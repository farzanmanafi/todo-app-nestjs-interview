import {
  Process,
  Processor,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import {
  QUEUE_NAMES,
  JOB_NAMES,
  CleanupJobData,
} from '../queue/queue.constants';
import { TodoService } from '@domain/todo/todo-service';

@Processor(QUEUE_NAMES.CLEANUP)
export class CleanupProcessor {
  private readonly logger = new Logger(CleanupProcessor.name);

  constructor(private readonly todoService: TodoService) {}

  /**
   * Process cleanup job
   * Deletes completed todos older than specified days
   */
  @Process(JOB_NAMES.CLEANUP_COMPLETED_TODOS)
  async handleCleanupCompletedTodos(
    job: Job<CleanupJobData>,
  ): Promise<{ deleted: number }> {
    this.logger.log(`Processing cleanup job ${job.id}`);

    const { olderThanDays } = job.data;

    try {
      const deletedCount = await this.todoService.cleanupOldCompletedTodos();

      this.logger.log(
        `Cleanup completed: deleted ${deletedCount} todos older than ${olderThanDays} days`,
      );

      return { deleted: deletedCount };
    } catch (error) {
      this.logger.error('Failed to cleanup old completed todos', error.stack);
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job): void {
    this.logger.debug(`Processing cleanup job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: { deleted: number }): void {
    this.logger.log(
      `Cleanup job ${job.id} completed - deleted ${result.deleted} todos`,
    );
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `Cleanup job ${job.id} failed: ${error.message}`,
      error.stack,
    );
  }
}
