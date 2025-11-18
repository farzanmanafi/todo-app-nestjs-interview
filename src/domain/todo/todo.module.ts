import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Todo } from './entities/todo.entity';
import { CategoryModule } from '../category/category.module';
import { UsersModule } from '../users/users.module';
import { QueueModule } from '@infrastructure/queue/queue.module';
import { TodoController } from './todo-controller';
import { TodoService } from './todo-service';
import { TodoEventListener } from './listeners/todo-event.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([Todo]),
    CategoryModule,
    UsersModule,
    forwardRef(() => QueueModule),
  ],
  controllers: [TodoController],
  providers: [TodoService, TodoEventListener],
  exports: [TodoService, TypeOrmModule],
})
export class TodoModule {}
