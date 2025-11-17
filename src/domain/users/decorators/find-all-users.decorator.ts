import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UserResponseDto } from '../dto/user-response.dto';
import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';

export const FindAllUsersDec = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all users',
      description:
        'Returns a list of all registered users in the system. Requires authentication.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiOkResponse({
      description: 'List of all users retrieved successfully',
      type: UserResponseDto,
      isArray: true,
      schema: {
        example: [
          {
            id: 'uuid-1',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe',
            isActive: true,
            emailVerified: true,
            createdAt: '2024-01-15T10:30:00Z',
          },
          {
            id: 'uuid-2',
            email: 'jane.smith@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            isActive: true,
            emailVerified: false,
            createdAt: '2024-01-16T14:20:00Z',
          },
        ],
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. Invalid or missing authentication token.',
      type: UnauthorizedExceptionDto,
    }),
  );
};
