import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Todo, TodoStatus, TodoPriority } from '../entities/todo.entity';
import { CategoryResponseDto } from '../../category/dto/category-response.dto';

export class TodoResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Complete project documentation' })
  title: string;

  @ApiPropertyOptional({
    example: 'Write comprehensive documentation for the API endpoints',
  })
  description: string;

  @ApiProperty({ example: TodoStatus.PENDING, enum: TodoStatus })
  status: TodoStatus;

  @ApiProperty({ example: TodoPriority.HIGH, enum: TodoPriority })
  priority: TodoPriority;

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59.000Z' })
  dueDate: Date;

  @ApiPropertyOptional({ example: '2024-12-20T10:30:00.000Z' })
  completedAt: Date;

  @ApiProperty({ example: false })
  isNotificationSent: boolean;

  @ApiPropertyOptional({ example: ['work', 'urgent'], type: [String] })
  tags: string[];

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174000' })
  categoryId: string;

  @ApiPropertyOptional({ type: () => CategoryResponseDto })
  category?: CategoryResponseDto;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;

  constructor(todo: Todo) {
    this.id = todo.id;
    this.title = todo.title;
    this.description = todo.description;
    this.status = todo.status;
    this.priority = todo.priority;
    this.dueDate = todo.dueDate;
    this.completedAt = todo.completedAt;
    this.isNotificationSent = todo.isNotificationSent;
    this.tags = todo.tags;
    this.userId = todo.userId;
    this.categoryId = todo.categoryId;
    this.createdAt = todo.createdAt;
    this.updatedAt = todo.updatedAt;

    if (todo.category) {
      this.category = new CategoryResponseDto(todo.category);
    }
  }
}
