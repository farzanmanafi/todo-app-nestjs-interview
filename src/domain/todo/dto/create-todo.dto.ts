import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { TodoStatus, TodoPriority } from '../entities/todo.entity';

export class CreateTodoDto {
  @ApiProperty({
    example: 'Complete project documentation',
    description: 'Todo title (3-200 characters)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Title is required' })
  @MinLength(3, { message: 'Title must be at least 3 characters' })
  @MaxLength(200, { message: 'Title must not exceed 200 characters' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @ApiPropertyOptional({
    example: 'Write comprehensive documentation for the API endpoints',
    description: 'Detailed description of the todo',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiPropertyOptional({
    example: TodoStatus.PENDING,
    enum: TodoStatus,
    description: 'Todo status',
    default: TodoStatus.PENDING,
  })
  @IsEnum(TodoStatus, { message: 'Invalid status value' })
  @IsOptional()
  status?: TodoStatus;

  @ApiPropertyOptional({
    example: TodoPriority.HIGH,
    enum: TodoPriority,
    description: 'Todo priority level',
    default: TodoPriority.MEDIUM,
  })
  @IsEnum(TodoPriority, { message: 'Invalid priority value' })
  @IsOptional()
  priority?: TodoPriority;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59.000Z',
    description: 'Due date for the todo',
  })
  @IsDateString(
    {},
    { message: 'Due date must be a valid ISO 8601 date string' },
  )
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    example: ['work', 'urgent', 'documentation'],
    description: 'Tags for categorizing the todo',
    type: [String],
  })
  @IsArray({ message: 'Tags must be an array' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Category ID to assign this todo',
  })
  @IsUUID('4', { message: 'Category ID must be a valid UUID' })
  @IsOptional()
  categoryId?: string;
}
