import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Work',
    description: 'Category name (3-100 characters)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  @MinLength(3, { message: 'Category name must be at least 3 characters' })
  @MaxLength(100, { message: 'Category name must not exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({
    example: 'Work-related tasks and projects',
    description: 'Category description',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Description must not exceed 500 characters' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiPropertyOptional({
    example: '#6366f1',
    description: 'Category color in hex format',
    default: '#6366f1',
  })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color (e.g., #6366f1)',
  })
  color?: string;
}
