import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserResponseDto } from '@domain/users/dto/user-response.dto';
import { UnauthorizedExceptionDto } from '@domain/shared/dto/unauthorized-Exception.dto';

export function GetProfileDec() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get current user profile',
      description: 'Retrieve the profile information of the authenticated user',
    }),
    ApiBearerAuth('JWT-auth'),
    ApiOkResponse({
      description: 'User profile retrieved successfully',
      type: UserResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized. Invalid or missing token.',
      type: UnauthorizedExceptionDto,
    }),
  );
}
