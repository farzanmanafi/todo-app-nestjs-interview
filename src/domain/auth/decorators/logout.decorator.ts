import { BadRequestDto } from '@domain/shared/dto/bad-request.dto';
import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

export function LogoutDec() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Log out user',
      description:
        'Invalidate the refresh token to log out the currently authenticated user',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiOkResponse({
      description: 'User logged out successfully.',
      schema: {
        example: {
          message: 'Logged out successfully',
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Bad request. Invalid refresh token provided.',
      type: BadRequestDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. Missing or invalid authentication token.',
    }),
  );
}
