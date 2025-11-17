import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
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
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: 'Create a new user',
      description:
        'Creates a new user account with the provided details. Email must be unique.',
    }),
    ApiBody({
      description: 'User details for account creation',
      type: CreateUserDto,
      examples: {
        example1: {
          summary: 'Basic user creation',
          value: {
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: 'User account created successfully',
      type: UserResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Invalid user data or validation failed',
      type: BadRequestDto,
    }),
    ApiConflictResponse({
      description: 'User with this email already exists',
      type: ConflictExceptionDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. Invalid or missing authentication token.',
      type: UnauthorizedExceptionDto,
    }),
  );
};
