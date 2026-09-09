import { z } from 'zod';

const envSchema = z.object({
  CALLER_RECORD_TABLE_NAME: z.string().min(1),
  VANITY_INDEX_PATH: z.string().min(1).default('/opt/vanity-index.json'),
  VANITY_NUMBERS_TO_SAVE: z.coerce.number().int().positive().default(5),
  VANITY_NUMBERS_TO_RETURN: z.coerce.number().int().positive().default(3),
});

export const env = envSchema.parse(process.env);
