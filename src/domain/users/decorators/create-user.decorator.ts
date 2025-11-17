import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiBody,
} from '@nestjs/swagger';

import { CreateUserDto } from '../dto/create-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';

import { BadRequestDto } from '@domain/shared/dto/bad-request.dto';
import { ConflictExceptionDto } from '@domain/shared/dto/conflict-exception.dto';
import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';
export const CreateUserDec = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new user',
      description: 'Creates a user and returns the created user object.',
    }),
    ApiBody({ type: CreateUserDto }),
    ApiCreatedResponse({
      description: 'User created successfully',
      type: UserResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Invalid user data',
      type: BadRequestDto,
    }),
    ApiConflictResponse({
      description: 'Email already exists',
      type: ConflictExceptionDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
      type: UnauthorizedExceptionDto,
    }),
  );
};
