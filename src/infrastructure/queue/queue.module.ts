import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { QueueService } from './queue.service';
import { NotificationModule } from '../../domain/notification/notification.module';
import { TodoModule } from '../../domain/todo/todo.module';
import { QUEUE_NAMES } from './queue.constants';
import { SchedulerService } from './scheduler.service';
import { NotificationProcessor } from '@infrastructure/processors/notification.processor';
import { CleanupProcessor } from '@infrastructure/processors/cleanup.processor';
import { QueueController } from './queue.controller';

@Module({
  imports: [
    // Register notification queue
    BullModule.registerQueueAsync({
      name: QUEUE_NAMES.NOTIFICATION,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    }),

    // Register cleanup queue
    BullModule.registerQueueAsync({
      name: QUEUE_NAMES.CLEANUP,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 5000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
    }),

    NotificationModule,
    forwardRef(() => TodoModule),
  ],
  controllers: [QueueController],
  providers: [
    QueueService,
    SchedulerService,
    NotificationProcessor,
    CleanupProcessor,
  ],
  exports: [QueueService, SchedulerService],
})
export class QueueModule {}
