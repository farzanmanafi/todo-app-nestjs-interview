import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiBody,
} from '@nestjs/swagger';

import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';

import { BadRequestDto } from '@domain/shared/dto/bad-request.dto';
import { NotFoundExceptionDto } from '@domain/shared/dto/not-found-exception.dto';
import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';
import { ConflictExceptionDto } from '@domain/shared/dto/conflict-exception.dto';

export const UpdateUserDec = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Update user by ID',
      description: 'Updates an existing user.',
    }),
    ApiBody({ type: UpdateUserDto }),
    ApiOkResponse({
      description: 'User updated successfully',
      type: UserResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Invalid update data',
      type: BadRequestDto,
    }),
    ApiConflictResponse({
      description: 'Email already in use',
      type: ConflictExceptionDto,
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
