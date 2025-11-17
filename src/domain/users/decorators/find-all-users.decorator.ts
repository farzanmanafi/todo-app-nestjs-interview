import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UserResponseDto } from '../dto/user-response.dto';

import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';

export const FindAllUsersDec = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all users',
      description: 'Returns a list of all registered users.',
    }),
    ApiOkResponse({
      description: 'List of all users',
      type: UserResponseDto,
      isArray: true,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      type: UnauthorizedExceptionDto,
    }),
  );
};
