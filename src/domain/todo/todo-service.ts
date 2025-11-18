import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Todo, TodoStatus } from './entities/todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';
import { TodoResponseDto } from './dto/todo-response.dto';
import { CategoryService } from '../category/category.service';

@Injectable()
export class TodoService {
  private readonly logger = new Logger(TodoService.name);
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'todo:';

  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
    private readonly categoryService: CategoryService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new todo
   */
  async create(
    userId: string,
    createTodoDto: CreateTodoDto,
  ): Promise<TodoResponseDto> {
    const { categoryId, dueDate, ...rest } = createTodoDto;

    // Validate category ownership if provided
    if (categoryId) {
      const isOwner = await this.categoryService.validateCategoryOwnership(
        categoryId,
        userId,
      );
      if (!isOwner) {
        throw new BadRequestException('Invalid category ID or access denied');
      }
    }

    // Create todo
    const todo = this.todoRepository.create({
      ...rest,
      userId,
      categoryId: categoryId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    const savedTodo = await this.todoRepository.save(todo);

    // Increment category todo count
    if (categoryId) {
      await this.categoryService.incrementTodoCount(categoryId);
    }

    // Emit event for new todo
    this.eventEmitter.emit('todo.created', {
      todoId: savedTodo.id,
      userId,
      dueDate: savedTodo.dueDate,
    });

    // Invalidate user's todo list cache
    await this.invalidateUserCache(userId);

    this.logger.log(`Todo created: ${savedTodo.title} by user ${userId}`);

    return new TodoResponseDto(savedTodo);
  }

  /**
   * Get all todos with filtering and pagination
   */
  async findAll(
    userId: string,
    queryDto: QueryTodoDto,
  ): Promise<{
    data: TodoResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      status,
      priority,
      categoryId,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    // Generate cache key
    const cacheKey = this.generateCacheKey(userId, queryDto);

    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for key: ${cacheKey}`);
      return cached as any;
    }

    // Build query
    const queryBuilder = this.todoRepository
      .createQueryBuilder('todo')
      .leftJoinAndSelect('todo.category', 'category')
      .where('todo.userId = :userId', { userId });

    // Apply filters
    if (status) {
      queryBuilder.andWhere('todo.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('todo.priority = :priority', { priority });
    }

    if (categoryId) {
      queryBuilder.andWhere('todo.categoryId = :categoryId', { categoryId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(todo.title ILIKE :search OR todo.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Count total
    const total = await queryBuilder.getCount();

    // Apply pagination and sorting
    const todos = await queryBuilder
      .orderBy(`todo.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const result = {
      data: todos.map((todo) => new TodoResponseDto(todo)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // Cache result
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Get a single todo by ID
   */
  async findOne(id: string, userId: string): Promise<TodoResponseDto> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;

    // Try cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for todo: ${id}`);
      return cached as TodoResponseDto;
    }

    const todo = await this.todoRepository.findOne({
      where: { id, userId },
      relations: ['category'],
    });

    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    const response = new TodoResponseDto(todo);

    // Cache the result
    await this.cacheManager.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  /**
   * Update a todo
   */
  async update(
    id: string,
    userId: string,
    updateTodoDto: UpdateTodoDto,
  ): Promise<TodoResponseDto> {
    const todo = await this.todoRepository.findOne({
      where: { id },
    });

    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    // Check ownership
    if (todo.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this todo',
      );
    }

    const oldCategoryId = todo.categoryId;
    const { categoryId, dueDate, status, ...rest } = updateTodoDto;

    // Validate new category ownership if changed
    if (categoryId && categoryId !== oldCategoryId) {
      const isOwner = await this.categoryService.validateCategoryOwnership(
        categoryId,
        userId,
      );
      if (!isOwner) {
        throw new BadRequestException('Invalid category ID or access denied');
      }
    }

    // Handle status change to completed
    if (
      status === TodoStatus.COMPLETED &&
      todo.status !== TodoStatus.COMPLETED
    ) {
      todo.completedAt = new Date();
    }

    // Update fields
    Object.assign(todo, {
      ...rest,
      categoryId: categoryId !== undefined ? categoryId : todo.categoryId,
      dueDate: dueDate ? new Date(dueDate) : todo.dueDate,
      status: status || todo.status,
    });

    const updatedTodo = await this.todoRepository.save(todo);

    // Handle category count changes
    if (categoryId !== undefined && categoryId !== oldCategoryId) {
      if (oldCategoryId) {
        await this.categoryService.decrementTodoCount(oldCategoryId);
      }
      if (categoryId) {
        await this.categoryService.incrementTodoCount(categoryId);
      }
    }

    // Invalidate caches
    await this.invalidateTodoCache(id);
    await this.invalidateUserCache(userId);

    // Emit event
    this.eventEmitter.emit('todo.updated', {
      todoId: updatedTodo.id,
      userId,
      status: updatedTodo.status,
    });

    this.logger.log(`Todo updated: ${updatedTodo.title}`);

    return new TodoResponseDto(updatedTodo);
  }

  /**
   * Delete a todo
   */
  async remove(id: string, userId: string): Promise<{ message: string }> {
    const todo = await this.todoRepository.findOne({
      where: { id },
    });

    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    // Check ownership
    if (todo.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this todo',
      );
    }

    const categoryId = todo.categoryId;

    // Soft delete
    await this.todoRepository.softRemove(todo);

    // Decrement category count
    if (categoryId) {
      await this.categoryService.decrementTodoCount(categoryId);
    }

    // Invalidate caches
    await this.invalidateTodoCache(id);
    await this.invalidateUserCache(userId);

    // Emit event
    this.eventEmitter.emit('todo.deleted', {
      todoId: id,
      userId,
    });

    this.logger.log(`Todo deleted: ${todo.title} by user ${userId}`);

    return { message: 'Todo deleted successfully' };
  }

  /**
   * Get todos that need notification (24 hours before due date)
   */
  async getTodosForNotification(): Promise<Todo[]> {
    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return this.todoRepository.find({
      where: {
        dueDate: Between(now, twentyFourHoursLater),
        status: TodoStatus.PENDING,
        isNotificationSent: false,
      },
      relations: ['user'],
    });
  }

  /**
   * Mark notification as sent
   */
  async markNotificationSent(todoId: string): Promise<void> {
    await this.todoRepository.update(todoId, { isNotificationSent: true });
    await this.invalidateTodoCache(todoId);
  }

  /**
   * Get completed todos older than 30 days for cleanup
   */
  async getCompletedTodosForCleanup(): Promise<Todo[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return this.todoRepository.find({
      where: {
        status: TodoStatus.COMPLETED,
      },
      withDeleted: false,
    });
  }

  /**
   * Hard delete old completed todos
   */
  async cleanupOldCompletedTodos(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.todoRepository
      .createQueryBuilder()
      .delete()
      .where('status = :status', { status: TodoStatus.COMPLETED })
      .andWhere('completedAt < :date', { date: thirtyDaysAgo })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} old completed todos`);

    return result.affected || 0;
  }

  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  /**
   * Generate cache key for query
   */
  private generateCacheKey(userId: string, queryDto: QueryTodoDto): string {
    const params = new URLSearchParams(queryDto as any).toString();
    return `${this.CACHE_PREFIX}list:${userId}:${params}`;
  }

  /**
   * Invalidate todo cache
   */
  private async invalidateTodoCache(todoId: string): Promise<void> {
    const key = `${this.CACHE_PREFIX}${todoId}`;
    await this.cacheManager.del(key);
  }

  /**
   * Invalidate user's todo list cache
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    // In a production environment, you might want to use a more sophisticated
    // cache invalidation strategy, such as cache tags
    const keys = await this.cacheManager.store.keys();
    const userKeys = keys.filter((key: string) =>
      key.includes(`${this.CACHE_PREFIX}list:${userId}`),
    );

    await Promise.all(
      userKeys.map((key: string) => this.cacheManager.del(key)),
    );
  }
}
