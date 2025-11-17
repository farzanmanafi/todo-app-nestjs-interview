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
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';
// import {
//   CreateCategoryDec,
//   FindAllCategoriesDec,
//   FindOneCategoryDec,
//   UpdateCategoryDec,
//   RemoveCategoryDec,
// } from './decorators/category.decorators';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  // @CreateCategoryDec()
  create(@GetUser() user: User, @Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(user.id, createCategoryDto);
  }

  @Get()
  // @FindAllCategoriesDec()
  findAll(@GetUser() user: User) {
    return this.categoryService.findAll(user.id);
  }

  @Get(':id')
  // @FindOneCategoryDec()
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.categoryService.findOne(id, user.id);
  }

  @Patch(':id')
  // @UpdateCategoryDec()
  update(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, user.id, updateCategoryDto);
  }

  @Delete(':id')
  // @RemoveCategoryDec()
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.categoryService.remove(id, user.id);
  }
}
