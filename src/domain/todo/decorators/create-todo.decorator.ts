import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiBody,
} from '@nestjs/swagger';
import { CreateTodoDto } from '../dto/create-todo.dto';
import { TodoResponseDto } from '../dto/todo-response.dto';
import { BadRequestDto } from '@domain/shared/dto/bad-request.dto';

export const CreateTodoDec = (): MethodDecorator => {
  return applyDecorators(
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: 'Create a new todo',
      description:
        'Creates a new todo item for the authenticated user. Optionally assign it to a category.',
    }),
    ApiBody({
      description: 'Todo details',
      type: CreateTodoDto,
      examples: {
        basic: {
          summary: 'Basic todo',
          value: {
            title: 'Complete project documentation',
            description: 'Write comprehensive API documentation',
            priority: 'high',
            dueDate: '2024-12-31T23:59:59.000Z',
          },
        },
        withCategory: {
          summary: 'Todo with category',
          value: {
            title: 'Review pull requests',
            description: 'Review all pending PRs before EOD',
            priority: 'urgent',
            categoryId: '123e4567-e89b-12d3-a456-426614174000',
            tags: ['work', 'code-review'],
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: 'Todo created successfully',
      type: TodoResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Invalid todo data or validation failed',
      type: BadRequestDto,
    }),
  );
};
