import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiOkResponse, ApiQuery } from '@nestjs/swagger';

export const FindAllTodosDec = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all todos',
      description:
        'Returns a paginated list of todos for the authenticated user with optional filtering and sorting.',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['pending', 'in_progress', 'completed', 'archived'],
      description: 'Filter by status',
    }),
    ApiQuery({
      name: 'priority',
      required: false,
      enum: ['low', 'medium', 'high', 'urgent'],
      description: 'Filter by priority',
    }),
    ApiQuery({
      name: 'categoryId',
      required: false,
      type: String,
      description: 'Filter by category ID',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search in title and description',
    }),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page',
      example: 10,
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      enum: ['createdAt', 'updatedAt', 'dueDate', 'priority', 'status'],
      description: 'Sort field',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['ASC', 'DESC'],
      description: 'Sort order',
    }),
    ApiOkResponse({
      description: 'List of todos retrieved successfully',
      schema: {
        example: {
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              title: 'Complete project documentation',
              description: 'Write comprehensive API documentation',
              status: 'pending',
              priority: 'high',
              dueDate: '2024-12-31T23:59:59.000Z',
              userId: '123e4567-e89b-12d3-a456-426614174000',
              createdAt: '2024-11-18T10:30:00.000Z',
            },
          ],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    }),
  );
};
