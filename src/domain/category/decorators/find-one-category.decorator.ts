import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CategoryResponseDto } from '../dto/category-response.dto';
import { NotFoundExceptionDto } from '@domain/shared/dto/not-found-exception.dto';
import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';

export const FindOneCategoryDec = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Get category by ID',
      description:
        'Retrieves detailed information about a specific category by its unique ID. The category must belong to the authenticated user.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      description: 'Unique category identifier (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
      type: String,
    }),
    ApiOkResponse({
      description: 'Category found and retrieved successfully',
      type: CategoryResponseDto,
      schema: {
        example: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Work',
          description: 'Work-related tasks and projects',
          color: '#6366f1',
          userId: 'user-uuid',
          todoCount: 5,
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-11-18T10:30:00Z',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Category with the specified ID was not found or does not belong to the user',
      type: NotFoundExceptionDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. Invalid or missing authentication token.',
      type: UnauthorizedExceptionDto,
    }),
  );
};
