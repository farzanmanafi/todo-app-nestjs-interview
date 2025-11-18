import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from './entities/user.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { CreateUserDec } from './decorators/create-user.decorator';
import { FindAllUsersDec } from './decorators/find-all-users.decorator';
import { GetProfileDec } from '@domain/auth/decorators/get-profile.decorator';
import { FindOneUserDec } from './decorators/find-one-user.decorator';
import { UpdateUserDec } from './decorators/update-user.decorator';
import { RemoveUserDec } from './decorators/remove-user.decorator';
import { Public } from '@domain/auth/decorators/public.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // @Public()
  @Post()
  @CreateUserDec()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @FindAllUsersDec()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @GetProfileDec()
  getProfile(@GetUser() user: User) {
    return this.usersService.findOne(user.id);
  }

  @Get(':id')
  @FindOneUserDec()
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UpdateUserDec()
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @RemoveUserDec()
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
