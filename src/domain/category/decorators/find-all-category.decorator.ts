import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CategoryResponseDto } from '../dto/category-response.dto';
import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';

export const FindAllCategoriesDec = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all categories',
      description:
        'Retrieves all categories belonging to the authenticated user. Categories are sorted by creation date (newest first).',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiOkResponse({
      description: 'List of all user categories retrieved successfully',
      type: CategoryResponseDto,
      isArray: true,
      schema: {
        example: [
          {
            id: 'uuid-1',
            name: 'Work',
            description: 'Work-related tasks and projects',
            color: '#6366f1',
            userId: 'user-uuid',
            todoCount: 5,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z',
          },
          {
            id: 'uuid-2',
            name: 'Personal',
            description: 'Personal tasks',
            color: '#10b981',
            userId: 'user-uuid',
            todoCount: 3,
            createdAt: '2024-01-16T14:20:00Z',
            updatedAt: '2024-01-16T14:20:00Z',
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
