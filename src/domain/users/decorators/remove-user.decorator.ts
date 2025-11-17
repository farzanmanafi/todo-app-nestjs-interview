import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { NotFoundExceptionDto } from '@domain/shared/dto/not-found-exception.dto';
import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';

export const RemoveUserDec = (): MethodDecorator => {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Deactivate user by ID',
      description:
        'Soft-deletes a user by setting their isActive status to false. The user account is not permanently deleted but is deactivated. Requires authentication.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      description: 'Unique user identifier (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
      type: String,
    }),
    ApiOkResponse({
      description: 'User deactivated successfully',
      schema: {
        example: {
          message: 'User deactivated successfully',
          userId: '550e8400-e29b-41d4-a716-446655440000',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'User with the specified ID was not found',
      type: NotFoundExceptionDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. Invalid or missing authentication token.',
      type: UnauthorizedExceptionDto,
    }),
  );
};
