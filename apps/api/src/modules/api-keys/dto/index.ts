import { createZodDto } from 'nestjs-zod';
import { createApiKeySchema } from '@qrgen/shared';

export class CreateApiKeyDto extends createZodDto(createApiKeySchema) {}
