import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  QUEUE_NAMES,
  JOB_NAMES,
  JOB_PRIORITIES,
  CleanupJobData,
} from './queue.constants';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.CLEANUP)
    private readonly cleanupQueue: Queue,
  ) {}

  async onModuleInit() {
    this.logger.log('Scheduler service initialized');
    // Schedule initial cleanup job
    await this.scheduleCleanupJob();
  }

  /**
   * Schedule cleanup job to run daily at 2 AM
   * Cleans up completed todos older than 30 days
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: 'cleanup-completed-todos',
    timeZone: 'UTC',
  })
  async handleScheduledCleanup(): Promise<void> {
    this.logger.log('Running scheduled cleanup task');

    await this.scheduleCleanupJob();
  }

  /**
   * Schedule cleanup job manually
   */
  async scheduleCleanupJob(): Promise<void> {
    try {
      const job = await this.cleanupQueue.add(
        JOB_NAMES.CLEANUP_COMPLETED_TODOS,
        {
          olderThanDays: 30,
        } as CleanupJobData,
        {
          priority: JOB_PRIORITIES.LOW,
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );

      this.logger.log(
        `Scheduled cleanup job ${job.id} to delete todos older than 30 days`,
      );
    } catch (error) {
      this.logger.error('Failed to schedule cleanup job', error.stack);
    }
  }

  /**
   * Get cleanup queue health
   */
  async getCleanupQueueHealth(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.cleanupQueue.getWaitingCount(),
      this.cleanupQueue.getActiveCount(),
      this.cleanupQueue.getCompletedCount(),
      this.cleanupQueue.getFailedCount(),
      this.cleanupQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Manually trigger cleanup
   */
  async triggerManualCleanup(): Promise<void> {
    this.logger.log('Manual cleanup triggered');
    await this.scheduleCleanupJob();
  }
}
