import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { QueueService } from './queue.service';
import { SchedulerService } from './scheduler.service';
import { QueueController } from './queue.controller';
import { NotificationProcessor } from './processors/notification.processor';
import { CleanupProcessor } from './processors/cleanup.processor';
import { NotificationModule } from '../../domain/notification/notification.module';
import { TodoModule } from '../../domain/todo/todo.module';
import { QUEUE_NAMES } from './queue.constants';

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
    TodoModule,
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
