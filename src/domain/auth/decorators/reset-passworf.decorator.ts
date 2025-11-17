import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { BadRequestDto } from '@domain/shared/dto/bad-request.dto';

export const ResetPasswordDec = () =>
  applyDecorators(
    ApiOperation({ summary: 'Reset password' }),
    ApiBody({
      description: 'Password reset token and new password',
      type: ResetPasswordDto,
    }),
    ApiOkResponse({ description: 'Password reset successfully' }),
    ApiBadRequestResponse({
      description: 'Bad request. Invalid or expired reset token.',
      type: BadRequestDto,
    }),
  );
