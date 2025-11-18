// import { Test, TestingModule } from '@nestjs/testing';
// import { getRepositoryToken } from '@nestjs/typeorm';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import { EventEmitter2 } from '@nestjs/event-emitter';
// import {
//   NotFoundException,
//   ForbiddenException,
//   BadRequestException,
// } from '@nestjs/common';

// import { TodoService } from './todo.service';
// import { Todo, TodoStatus, TodoPriority } from './entities/todo.entity';
// import { CategoryService } from '../category/category.service';
// import { CreateTodoDto } from './dto/create-todo.dto';
// import { UpdateTodoDto } from './dto/update-todo.dto';

// describe('TodoService', () => {
//   let service: TodoService;
//   let mockTodoRepository: any;
//   let mockCategoryService: any;
//   let mockCacheManager: any;
//   let mockEventEmitter: any;

//   const mockTodo: Partial<Todo> = {
//     id: 'todo-id-123',
//     title: 'Test Todo',
//     description: 'Test Description',
//     status: TodoStatus.PENDING,
//     priority: TodoPriority.MEDIUM,
//     userId: 'user-id-123',
//     categoryId: 'category-id-123',
//     isNotificationSent: false,
//     tags: ['test'],
//     dueDate: new Date('2024-12-31'),
//     completedAt: null,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   };

//   beforeEach(async () => {
//     mockTodoRepository = {
//       create: jest.fn(),
//       save: jest.fn(),
//       findOne: jest.fn(),
//       find: jest.fn(),
//       update: jest.fn(),
//       softRemove: jest.fn(),
//       createQueryBuilder: jest.fn(() => ({
//         leftJoinAndSelect: jest.fn().mockReturnThis(),
//         where: jest.fn().mockReturnThis(),
//         andWhere: jest.fn().mockReturnThis(),
//         orderBy: jest.fn().mockReturnThis(),
//         skip: jest.fn().mockReturnThis(),
//         take: jest.fn().mockReturnThis(),
//         getCount: jest.fn(),
//         getMany: jest.fn(),
//         delete: jest.fn().mockReturnThis(),
//         execute: jest.fn(),
//       })),
//     };

//     mockCategoryService = {
//       validateCategoryOwnership: jest.fn(),
//       incrementTodoCount: jest.fn(),
//       decrementTodoCount: jest.fn(),
//     };

//     mockCacheManager = {
//       get: jest.fn(),
//       set: jest.fn(),
//       del: jest.fn(),
//       store: {
//         keys: jest.fn().mockResolvedValue([]),
//       },
//     };

//     mockEventEmitter = {
//       emit: jest.fn(),
//     };

//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         TodoService,
//         {
//           provide: getRepositoryToken(Todo),
//           useValue: mockTodoRepository,
//         },
//         {
//           provide: CategoryService,
//           useValue: mockCategoryService,
//         },
//         {
//           provide: CACHE_MANAGER,
//           useValue: mockCacheManager,
//         },
//         {
//           provide: EventEmitter2,
//           useValue: mockEventEmitter,
//         },
//       ],
//     }).compile();

//     service = module.get<TodoService>(TodoService);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   describe('create', () => {
//     it('should create a todo successfully', async () => {
//       const userId = 'user-id-123';
//       const createDto: CreateTodoDto = {
//         title: 'New Todo',
//         description: 'New Description',
//         priority: TodoPriority.HIGH,
//         categoryId: 'category-id-123',
//       };

//       mockCategoryService.validateCategoryOwnership.mockResolvedValue(true);
//       mockTodoRepository.create.mockReturnValue(mockTodo);
//       mockTodoRepository.save.mockResolvedValue(mockTodo);

//       const result = await service.create(userId, createDto);

//       expect(result).toBeDefined();
//       expect(result.title).toBe(mockTodo.title);
//       expect(
//         mockCategoryService.validateCategoryOwnership,
//       ).toHaveBeenCalledWith(createDto.categoryId, userId);
//       expect(mockCategoryService.incrementTodoCount).toHaveBeenCalledWith(
//         createDto.categoryId,
//       );
//       expect(mockEventEmitter.emit).toHaveBeenCalledWith(
//         'todo.created',
//         expect.any(Object),
//       );
//     });

//     it('should throw BadRequestException if category is invalid', async () => {
//       const userId = 'user-id-123';
//       const createDto: CreateTodoDto = {
//         title: 'New Todo',
//         categoryId: 'invalid-category',
//       };

//       mockCategoryService.validateCategoryOwnership.mockResolvedValue(false);

//       await expect(service.create(userId, createDto)).rejects.toThrow(
//         BadRequestException,
//       );
//     });

//     it('should create todo without category', async () => {
//       const userId = 'user-id-123';
//       const createDto: CreateTodoDto = {
//         title: 'New Todo',
//       };

//       mockTodoRepository.create.mockReturnValue(mockTodo);
//       mockTodoRepository.save.mockResolvedValue(mockTodo);

//       const result = await service.create(userId, createDto);

//       expect(result).toBeDefined();
//       expect(
//         mockCategoryService.validateCategoryOwnership,
//       ).not.toHaveBeenCalled();
//     });
//   });

//   describe('findAll', () => {
//     it('should return paginated todos', async () => {
//       const userId = 'user-id-123';
//       const queryDto = {
//         page: 1,
//         limit: 10,
//         sortBy: 'createdAt',
//         sortOrder: 'DESC' as const,
//       };

//       const mockQueryBuilder = mockTodoRepository.createQueryBuilder();
//       mockQueryBuilder.getCount.mockResolvedValue(1);
//       mockQueryBuilder.getMany.mockResolvedValue([mockTodo]);

//       const result = await service.findAll(userId, queryDto);

//       expect(result).toBeDefined();
//       expect(result.data).toHaveLength(1);
//       expect(result.total).toBe(1);
//       expect(result.page).toBe(1);
//       expect(result.limit).toBe(10);
//     });

//     it('should use cached results if available', async () => {
//       const userId = 'user-id-123';
//       const queryDto = {
//         page: 1,
//         limit: 10,
//       };

//       const cachedResult = {
//         data: [mockTodo],
//         total: 1,
//         page: 1,
//         limit: 10,
//         totalPages: 1,
//       };

//       mockCacheManager.get.mockResolvedValue(cachedResult);

//       const result = await service.findAll(userId, queryDto);

//       expect(result).toEqual(cachedResult);
//       expect(mockTodoRepository.createQueryBuilder).not.toHaveBeenCalled();
//     });
//   });

//   describe('findOne', () => {
//     it('should return a todo by id', async () => {
//       const todoId = 'todo-id-123';
//       const userId = 'user-id-123';

//       mockTodoRepository.findOne.mockResolvedValue(mockTodo);

//       const result = await service.findOne(todoId, userId);

//       expect(result).toBeDefined();
//       expect(result.id).toBe(todoId);
//       expect(mockTodoRepository.findOne).toHaveBeenCalledWith({
//         where: { id: todoId, userId },
//         relations: ['category'],
//       });
//     });

//     it('should throw NotFoundException if todo not found', async () => {
//       const todoId = 'non-existent-id';
//       const userId = 'user-id-123';

//       mockTodoRepository.findOne.mockResolvedValue(null);

//       await expect(service.findOne(todoId, userId)).rejects.toThrow(
//         NotFoundException,
//       );
//     });

//     it('should use cache if available', async () => {
//       const todoId = 'todo-id-123';
//       const userId = 'user-id-123';

//       mockCacheManager.get.mockResolvedValue(mockTodo);

//       const result = await service.findOne(todoId, userId);

//       expect(result).toBeDefined();
//       expect(mockTodoRepository.findOne).not.toHaveBeenCalled();
//     });
//   });

//   describe('update', () => {
//     it('should update a todo successfully', async () => {
//       const todoId = 'todo-id-123';
//       const userId = 'user-id-123';
//       const updateDto: UpdateTodoDto = {
//         title: 'Updated Title',
//         status: TodoStatus.COMPLETED,
//       };

//       const updatedTodo = { ...mockTodo, ...updateDto };

//       mockTodoRepository.findOne.mockResolvedValue(mockTodo);
//       mockTodoRepository.save.mockResolvedValue(updatedTodo);

//       const result = await service.update(todoId, userId, updateDto);

//       expect(result).toBeDefined();
//       expect(result.title).toBe(updateDto.title);
//       expect(mockEventEmitter.emit).toHaveBeenCalledWith(
//         'todo.updated',
//         expect.any(Object),
//       );
//     });

//     it('should throw NotFoundException if todo not found', async () => {
//       const todoId = 'non-existent-id';
//       const userId = 'user-id-123';
//       const updateDto: UpdateTodoDto = { title: 'Updated' };

//       mockTodoRepository.findOne.mockResolvedValue(null);

//       await expect(service.update(todoId, userId, updateDto)).rejects.toThrow(
//         NotFoundException,
//       );
//     });

//     it('should throw ForbiddenException if user is not the owner', async () => {
//       const todoId = 'todo-id-123';
//       const userId = 'different-user-id';
//       const updateDto: UpdateTodoDto = { title: 'Updated' };

//       mockTodoRepository.findOne.mockResolvedValue(mockTodo);

//       await expect(service.update(todoId, userId, updateDto)).rejects.toThrow(
//         ForbiddenException,
//       );
//     });

//     it('should set completedAt when status changes to completed', async () => {
//       const todoId = 'todo-id-123';
//       const userId = 'user-id-123';
//       const updateDto: UpdateTodoDto = {
//         status: TodoStatus.COMPLETED,
//       };

//       mockTodoRepository.findOne.mockResolvedValue(mockTodo);
//       mockTodoRepository.save.mockImplementation((todo) =>
//         Promise.resolve(todo),
//       );

//       await service.update(todoId, userId, updateDto);

//       const savedTodo = mockTodoRepository.save.mock.calls[0][0];
//       expect(savedTodo.completedAt).toBeDefined();
//     });
//   });

//   describe('remove', () => {
//     it('should delete a todo successfully', async () => {
//       const todoId = 'todo-id-123';
//       const userId = 'user-id-123';

//       mockTodoRepository.findOne.mockResolvedValue(mockTodo);
//       mockTodoRepository.softRemove.mockResolvedValue(mockTodo);

//       const result = await service.remove(todoId, userId);

//       expect(result).toEqual({ message: 'Todo deleted successfully' });
//       expect(mockCategoryService.decrementTodoCount).toHaveBeenCalledWith(
//         mockTodo.categoryId,
//       );
//       expect(mockEventEmitter.emit).toHaveBeenCalledWith(
//         'todo.deleted',
//         expect.any(Object),
//       );
//     });

//     it('should throw NotFoundException if todo not found', async () => {
//       const todoId = 'non-existent-id';
//       const userId = 'user-id-123';

//       mockTodoRepository.findOne.mockResolvedValue(null);

//       await expect(service.remove(todoId, userId)).rejects.toThrow(
//         NotFoundException,
//       );
//     });

//     it('should throw ForbiddenException if user is not the owner', async () => {
//       const todoId = 'todo-id-123';
//       const userId = 'different-user-id';

//       mockTodoRepository.findOne.mockResolvedValue(mockTodo);

//       await expect(service.remove(todoId, userId)).rejects.toThrow(
//         ForbiddenException,
//       );
//     });
//   });

//   describe('getTodosForNotification', () => {
//     it('should return todos due in 24 hours', async () => {
//       mockTodoRepository.find.mockResolvedValue([mockTodo]);

//       const result = await service.getTodosForNotification();

//       expect(result).toBeDefined();
//       expect(Array.isArray(result)).toBe(true);
//       expect(mockTodoRepository.find).toHaveBeenCalledWith(
//         expect.objectContaining({
//           where: expect.objectContaining({
//             status: TodoStatus.PENDING,
//             isNotificationSent: false,
//           }),
//         }),
//       );
//     });
//   });

//   describe('cleanupOldCompletedTodos', () => {
//     it('should delete old completed todos', async () => {
//       const mockQueryBuilder = mockTodoRepository.createQueryBuilder();
//       mockQueryBuilder.execute.mockResolvedValue({ affected: 5 });

//       const result = await service.cleanupOldCompletedTodos();

//       expect(result).toBe(5);
//       expect(mockQueryBuilder.delete).toHaveBeenCalled();
//     });
//   });
// });
