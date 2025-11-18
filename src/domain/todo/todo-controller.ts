import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';

import { CreateTodoDto } from './dto/create-todo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

import { TodoService } from './todo-service';
import { CreateTodoDec } from './decorators/create-todo.decorator';
import { FindAllTodosDec } from './decorators/find-all-todo.decorator';
import { QueryTodoDto } from './dto/query-todo.dto';
import { FindOneTodoDec } from './decorators/findone-todo.decorator';
import { UpdateTodoDec } from './decorators/update-todo.decorator';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { RemoveTodoDec } from './decorators/remove-todo.decorator';

@ApiTags('Todos')
@Controller('todos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  @CreateTodoDec()
  create(@GetUser() user: User, @Body() createTodoDto: CreateTodoDto) {
    return this.todoService.create(user.id, createTodoDto);
  }

  @Get()
  @FindAllTodosDec()
  @UseInterceptors(CacheInterceptor)
  findAll(@GetUser() user: User, @Query() queryDto: QueryTodoDto) {
    return this.todoService.findAll(user.id, queryDto);
  }

  @Get(':id')
  @FindOneTodoDec()
  @UseInterceptors(CacheInterceptor)
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.todoService.findOne(id, user.id);
  }

  @Patch(':id')
  @UpdateTodoDec()
  update(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    return this.todoService.update(id, user.id, updateTodoDto);
  }

  @Delete(':id')
  @RemoveTodoDec()
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.todoService.remove(id, user.id);
  }
}
