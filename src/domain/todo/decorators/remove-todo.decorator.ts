import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
 
  ApiParam,
} from '@nestjs/swagger';

import { NotFoundExceptionDto } from '@domain/shared/dto/not-found-exception.dto';

// Remove Todo Decorator
export const RemoveTodoDec = (): MethodDecorator => {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Delete todo by ID',
      description:
        'Soft-deletes a todo by marking it as deleted. The todo is not permanently removed.',
    }),
    ApiParam({
      name: 'id',
      description: 'Unique todo identifier (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
      type: String,
    }),
    ApiOkResponse({
      description: 'Todo deleted successfully',
      schema: {
        example: {
          message: 'Todo deleted successfully',
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Todo with the specified ID was not found',
      type: NotFoundExceptionDto,
    }),
    ApiForbiddenResponse({
      description: 'You do not have permission to delete this todo',
    }),
  );
};