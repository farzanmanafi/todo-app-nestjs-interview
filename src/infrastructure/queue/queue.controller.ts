import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';

import { QueueService } from './queue.service';
import { JwtAuthGuard } from '@domain/auth/guards/jwt-auth.guard';
import { SchedulerService } from './scheduler.service';

@ApiTags('Queue Management')
@Controller('queue')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly schedulerService: SchedulerService,
  ) {}

  /**
   * Get queue health status
   */
  @Get('health')
  @ApiOperation({
    summary: 'Get queue health status',
    description:
      'Returns the health status of all job queues including counts of waiting, active, completed, failed, and delayed jobs.',
  })
  @ApiOkResponse({
    description: 'Queue health status retrieved successfully',
    schema: {
      example: {
        notification: {
          waiting: 5,
          active: 2,
          completed: 100,
          failed: 3,
          delayed: 10,
        },
        cleanup: {
          waiting: 0,
          active: 1,
          completed: 30,
          failed: 0,
          delayed: 1,
        },
        timestamp: '2024-11-18T10:30:00.000Z',
      },
    },
  })
  async getQueueHealth() {
    const notificationHealth =
      await this.queueService.getNotificationQueueHealth();
    const cleanupHealth = await this.schedulerService.getCleanupQueueHealth();

    return {
      notification: notificationHealth,
      cleanup: cleanupHealth,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Trigger manual cleanup
   */
  @Post('cleanup/trigger')
  @ApiOperation({
    summary: 'Trigger manual cleanup',
    description:
      'Manually triggers the cleanup job to remove old completed todos.',
  })
  @ApiOkResponse({
    description: 'Cleanup job triggered successfully',
    schema: {
      example: {
        message: 'Cleanup job scheduled successfully',
        scheduledAt: '2024-11-18T10:30:00.000Z',
      },
    },
  })
  async triggerCleanup() {
    await this.schedulerService.triggerManualCleanup();
    return {
      message: 'Cleanup job scheduled successfully',
      scheduledAt: new Date().toISOString(),
    };
  }
}
