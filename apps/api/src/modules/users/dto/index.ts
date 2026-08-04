import { createZodDto } from 'nestjs-zod';
import { updateProfileSchema } from '@qrgen/shared';

export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}
