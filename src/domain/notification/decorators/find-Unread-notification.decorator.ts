import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';

export const FindUnreadNotificationsDec = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Get unread notifications',
      description:
        'Retrieves only unread notifications for the authenticated user.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiOkResponse({
      description: 'List of unread notifications retrieved successfully',
      schema: {
        example: [
          {
            id: 'uuid-1',
            title: 'Todo Overdue',
            message: 'Your todo "Review documents" is overdue',
            type: 'todo_overdue',
            isRead: false,
            createdAt: '2024-01-15T10:30:00Z',
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
