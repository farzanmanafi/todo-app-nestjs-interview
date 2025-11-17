import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserResponseDto } from '../dto/user-response.dto';

import { NotFoundExceptionDto } from '@domain/shared/dto/not-found-exception.dto';
import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';

export const FindOneUserDec = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Get user by ID',
      description:
        'Retrieves detailed information about a specific user by their unique ID. Requires authentication.',
    }),
    ApiBearerAuth('JWT-auth'), 
    ApiParam({
      name: 'id',
      description: 'Unique user identifier (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
      type: String,
    }),
    ApiOkResponse({
      description: 'User found and retrieved successfully',
      type: UserResponseDto,
      schema: {
        example: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'john.doe@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          emailVerified: true,
          lastLoginAt: '2024-11-18T10:30:00Z',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-11-18T10:30:00Z',
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
