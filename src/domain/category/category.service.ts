import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Create a new category
   */
  async create(
    userId: string,
    createCategoryDto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const { name, description, color } = createCategoryDto;

    const category = this.categoryRepository.create({
      name: name.trim(),
      description: description?.trim(),
      color: color || '#6366f1',
      userId,
      todoCount: 0,
    });

    const savedCategory = await this.categoryRepository.save(category);
    this.logger.log(
      `Category created: ${savedCategory.name} by user ${userId}`,
    );

    return new CategoryResponseDto(savedCategory);
  }

  /**
   * Get all categories for a user
   */
  async findAll(userId: string): Promise<CategoryResponseDto[]> {
    const categories = await this.categoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return categories.map((category) => new CategoryResponseDto(category));
  }

  /**
   * Get a single category by ID
   */
  async findOne(id: string, userId: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return new CategoryResponseDto(category);
  }

  /**
   * Update a category
   */
  async update(
    id: string,
    userId: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check ownership
    if (category.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this category',
      );
    }

    // Update fields
    Object.assign(category, {
      ...updateCategoryDto,
      name: updateCategoryDto.name?.trim(),
      description: updateCategoryDto.description?.trim(),
    });

    const updatedCategory = await this.categoryRepository.save(category);
    this.logger.log(`Category updated: ${updatedCategory.name}`);

    return new CategoryResponseDto(updatedCategory);
  }

  /**
   * Delete a category
   */
  async remove(id: string, userId: string): Promise<{ message: string }> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check ownership
    if (category.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this category',
      );
    }

    await this.categoryRepository.softRemove(category);
    this.logger.log(`Category deleted: ${category.name} by user ${userId}`);

    return { message: 'Category deleted successfully' };
  }

  /**
   * Increment todo count
   */
  async incrementTodoCount(categoryId: string): Promise<void> {
    await this.categoryRepository.increment({ id: categoryId }, 'todoCount', 1);
  }

  /**
   * Decrement todo count
   */
  async decrementTodoCount(categoryId: string): Promise<void> {
    await this.categoryRepository.decrement({ id: categoryId }, 'todoCount', 1);
  }

  /**
   * Check if category exists and belongs to user
   */
  async validateCategoryOwnership(
    categoryId: string,
    userId: string,
  ): Promise<boolean> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, userId },
    });

    return !!category;
  }
}
