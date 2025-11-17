import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SignInDto } from '../dto/signin.dto';
import { TokenResponseDto } from '../dto/token-response.dto';
import { BadRequestDto } from '@domain/shared/dto/bad-request.dto';
import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';

export const SigninDec = (): MethodDecorator => {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Sign in user',
      description:
        'Authenticate user with email and password, returns access and refresh tokens',
    }),
    ApiBody({
      description: 'User credentials for authentication',
      type: SignInDto,
    }),
    ApiOkResponse({
      description: 'User signed in successfully',
      type: TokenResponseDto,
    }),
    ApiBadRequestResponse({
      description: 'Invalid request body or validation failed',
      type: BadRequestDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid email or password',
      type: UnauthorizedExceptionDto,
    }),
  );
};
