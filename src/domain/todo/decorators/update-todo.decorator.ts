import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { TodoResponseDto } from '../dto/todo-response.dto';
import { BadRequestDto } from '@domain/shared/dto/bad-request.dto';
import { NotFoundExceptionDto } from '@domain/shared/dto/not-found-exception.dto';
import { UpdateTodoDto } from '../dto/update-todo.dto';

// Update Todo Decorator
export const UpdateTodoDec = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Update todo by ID',
      description:
        'Updates an existing todo with new information. All fields are optional.',
    }),
    ApiParam({
      name: 'id',
      description: 'Unique todo identifier (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
      type: String,
    }),
    ApiBody({
      description: 'Updated todo details (all fields are optional)',
      type: UpdateTodoDto,
      examples: {
        statusUpdate: {
          summary: 'Update status',
          value: {
            status: 'completed',
          },
        },
        fullUpdate: {
          summary: 'Update multiple fields',
          value: {
            title: 'Updated title',
            description: 'Updated description',
            status: 'in_progress',
            priority: 'urgent',
          },
        },
      },
    }),
    ApiOkResponse({
      description: 'Todo updated successfully',
      type: TodoResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Invalid update data or validation failed',
      type: BadRequestDto,
    }),
    ApiNotFoundResponse({
      description: 'Todo with the specified ID was not found',
      type: NotFoundExceptionDto,
    }),
    ApiForbiddenResponse({
      description: 'You do not have permission to update this todo',
    }),
  );
};
