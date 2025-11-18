import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';

export const MarkAllAsReadDec = (): MethodDecorator => {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Mark all notifications as read',
      description:
        'Marks all unread notifications for the authenticated user as read.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiOkResponse({
      description: 'All notifications marked as read successfully',
      schema: {
        example: {
          affected: 5,
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. Invalid or missing authentication token.',
      type: UnauthorizedExceptionDto,
    }),
  );
};
