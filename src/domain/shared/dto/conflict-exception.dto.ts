import { ApiProperty } from '@nestjs/swagger';

export class ConflictExceptionDto {
  @ApiProperty({ example: 409, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({
    example: 'Conflict',
    description: 'Short error type',
  })
  error: string;

  @ApiProperty({
    example: 'Email already in use',
    description: 'Detailed error message',
  })
  message: string;
}
