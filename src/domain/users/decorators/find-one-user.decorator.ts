import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserResponseDto } from '../dto/user-response.dto';

import { NotFoundExceptionDto } from '@domain/shared/dto/not-found-exception.dto';
import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';

export const FindOneUserDec = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Get user by ID',
      description: 'Returns a user by their unique ID.',
    }),
    ApiOkResponse({
      description: 'User found',
      type: UserResponseDto,
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
