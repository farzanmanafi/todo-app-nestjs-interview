import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UserResponseDto } from '../dto/user-response.dto';

import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';

export const GetProfileDec = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Get current user profile',
      description: 'Returns the authenticated user’s profile.',
    }),
    ApiOkResponse({
      description: 'Current user profile',
      type: UserResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      type: UnauthorizedExceptionDto,
    }),
  );
};
