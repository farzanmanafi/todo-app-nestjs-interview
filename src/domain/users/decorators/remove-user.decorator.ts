import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { NotFoundExceptionDto } from '@domain/shared/dto/not-found-exception.dto';
import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';

export const RemoveUserDec = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Deactivate user by ID',
      description: 'Soft-deletes a user by setting isActive = false.',
    }),
    ApiOkResponse({
      description: 'User deactivated successfully',
    }),
    ApiNotFoundResponse({
      description: 'User not found',
      type: NotFoundExceptionDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      type: UnauthorizedExceptionDto,
    }),
  );
};
