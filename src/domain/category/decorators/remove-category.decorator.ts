import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { NotFoundExceptionDto } from '@domain/shared/dto/not-found-exception.dto';
import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';

export const RemoveCategoryDec = (): MethodDecorator => {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Delete category by ID',
      description:
        'Soft-deletes a category. The category is not permanently deleted but marked as deleted. The category must belong to the authenticated user. Any todos associated with this category should be handled appropriately.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiParam({
      name: 'id',
      description: 'Unique category identifier (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
      type: String,
    }),
    ApiOkResponse({
      description: 'Category deleted successfully',
      schema: {
        example: {
          message: 'Category deleted successfully',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Category with the specified ID was not found',
      type: NotFoundExceptionDto,
    }),
    ApiForbiddenResponse({
      description: 'You do not have permission to delete this category',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. Invalid or missing authentication token.',
      type: UnauthorizedExceptionDto,
    }),
  );
};
