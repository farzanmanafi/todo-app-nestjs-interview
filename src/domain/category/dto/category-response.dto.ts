import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../entities/category.entity';

export class CategoryResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Work' })
  name: string;

  @ApiProperty({ example: 'Work-related tasks and projects' })
  description: string;

  @ApiProperty({ example: '#6366f1' })
  color: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: 5 })
  todoCount: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  constructor(category: Category) {
    this.id = category.id;
    this.name = category.name;
    this.description = category.description;
    this.color = category.color;
    this.userId = category.userId;
    this.todoCount = category.todoCount;
    this.createdAt = category.createdAt;
    this.updatedAt = category.updatedAt;
  }
}
