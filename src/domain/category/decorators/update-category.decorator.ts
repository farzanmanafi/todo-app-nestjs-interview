import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { BadRequestDto } from '@domain/shared/dto/bad-request.dto';
import { NotFoundExceptionDto } from '@domain/shared/dto/not-found-exception.dto';
import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';

export const UpdateCategoryDec = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Update category by ID',
      description:
        'Updates an existing category with new information. All fields are optional. The category must belong to the authenticated user.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      description: 'Unique category identifier (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
      type: String,
    }),
    ApiBody({
      description: 'Updated category details (all fields are optional)',
      type: UpdateCategoryDto,
      examples: {
        updateName: {
          summary: 'Update name only',
          value: {
            name: 'Work Projects',
          },
        },
        updateColor: {
          summary: 'Update color only',
          value: {
            color: '#ef4444',
          },
        },
        updateMultiple: {
          summary: 'Update multiple fields',
          value: {
            name: 'Important Work',
            description: 'High-priority work tasks and projects',
            color: '#dc2626',
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Category updated successfully',
      type: CategoryResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Invalid update data or validation failed',
      type: BadRequestDto,
    }),
    ApiNotFoundResponse({
      description: 'Category with the specified ID was not found',
      type: NotFoundExceptionDto,
    }),
    ApiForbiddenResponse({
      description: 'You do not have permission to update this category',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. Invalid or missing authentication token.',
      type: UnauthorizedExceptionDto,
    }),
  );
};
