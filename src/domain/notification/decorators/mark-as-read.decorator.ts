import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';
import { NotFoundExceptionDto } from '@domain/shared/dto/not-found-exception.dto';

export const MarkAsReadDec = (): MethodDecorator => {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Mark notification as read',
      description: 'Marks a specific notification as read by its ID.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      description: 'Unique notification identifier (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
      type: String,
    }),
    ApiOkResponse({
      description: 'Notification marked as read successfully',
      schema: {
        example: {
          id: 'uuid-1',
          title: 'Todo Reminder',
          message: 'Your todo is due soon',
          type: 'todo_reminder',
          isRead: true,
          updatedAt: '2024-01-15T12:00:00Z',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Notification not found',
      type: NotFoundExceptionDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. Invalid or missing authentication token.',
      type: UnauthorizedExceptionDto,
    }),
  );
};
