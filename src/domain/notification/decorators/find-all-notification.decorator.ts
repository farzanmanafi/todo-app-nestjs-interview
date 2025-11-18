import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';

export const FindAllNotificationsDec = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all notifications',
      description:
        'Retrieves all notifications for the authenticated user, sorted by creation date (newest first).',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiOkResponse({
      description: 'List of all notifications retrieved successfully',
      schema: {
        example: [
          {
            id: 'uuid-1',
            title: 'Todo Reminder',
            message: 'Your todo "Complete project" is due in 24 hours',
            type: 'todo_reminder',
            isRead: false,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
          },
        ],
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. Invalid or missing authentication token.',
      type: UnauthorizedExceptionDto,
    }),
  );
};
