import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { CreateCategoryDto } from '../dto/create-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { BadRequestDto } from '@domain/shared/dto/bad-request.dto';
import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';

export const CreateCategoryDec = (): MethodDecorator => {
  return applyDecorators(
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: 'Create a new category',
      description:
        'Creates a new category for organizing todos. Each category belongs to the authenticated user.',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiBody({
      description: 'Category details for creation',
      type: CreateCategoryDto,
      examples: {
        example1: {
          summary: 'Basic category',
          value: {
            name: 'Work',
            description: 'Work-related tasks and projects',
            color: '#6366f1',
          },
        },
        example2: {
          summary: 'Minimal category',
          value: {
            name: 'Personal',
          },
        },
      },
    }),
    ApiCreatedResponse({
      description: 'Category created successfully',
      type: CategoryResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Invalid category data or validation failed',
      type: BadRequestDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. Invalid or missing authentication token.',
      type: UnauthorizedExceptionDto,
    }),
  );
};
