import { ApiProperty } from '@nestjs/swagger';

export class BadRequestDto {
  @ApiProperty({
    example: 400,
    description: 'HTTP status code',
  })
  statusCode: number;

  @ApiProperty({
    example: ['email must be a valid email', 'password is too weak'],
    description: 'Array of validation error messages',
    type: [String],
  })
  message: string[];

  @ApiProperty({
    example: 'Bad Request',
    description: 'Error type',
  })
  error: string;
}
