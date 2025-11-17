import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
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
      description:
        'Updates an existing user account with new information. Email uniqueness is validated if email is being changed. Requires authentication.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      description: 'Unique user identifier (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
      type: String,
    }),
    ApiBody({
      description: 'Updated user details (all fields are optional)',
      type: UpdateUserDto,
      examples: {
        updateEmail: {
          summary: 'Update email only',
          value: {
            email: 'newemail@example.com',
          },
        },
        updateName: {
          summary: 'Update name only',
          value: {
            firstName: 'Jane',
            lastName: 'Smith',
          },
        },
        updateMultiple: {
          summary: 'Update multiple fields',
          value: {
            email: 'updated@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'User updated successfully',
      type: UserResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Invalid update data or validation failed',
      type: BadRequestDto,
    }),
    ApiConflictResponse({
      description: 'Email is already in use by another user',
      type: ConflictExceptionDto,
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
