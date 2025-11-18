import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';

import { TodoResponseDto } from '../dto/todo-response.dto';
import { NotFoundExceptionDto } from '@domain/shared/dto/not-found-exception.dto';

// Find One Todo Decorator
export const FindOneTodoDec = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Get todo by ID',
      description:
        'Retrieves detailed information about a specific todo by its unique ID.',
    }),
    ApiParam({
      name: 'id',
      description: 'Unique todo identifier (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
      type: String,
    }),
    ApiOkResponse({
      description: 'Todo found and retrieved successfully',
      type: TodoResponseDto,
    }),
    ApiNotFoundResponse({
      description: 'Todo with the specified ID was not found',
      type: NotFoundExceptionDto,
    }),
  );
};
