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
export const RemoveNotificationDec = (): MethodDecorator => {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Delete notification',
      description: 'Permanently deletes a notification by its ID.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      description: 'Unique notification identifier (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
      type: String,
    }),
    ApiOkResponse({
      description: 'Notification deleted successfully',
      schema: {
        example: {
          message: 'Notification deleted successfully',
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
