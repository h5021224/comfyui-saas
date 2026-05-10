import { z } from 'zod';

export const generateRequestSchema = z.object({
  prompt: z.string().trim().min(1, 'Prompt is required').max(2000),
  negativePrompt: z.string().trim().max(2000).optional().default(''),
  width: z.number().int().min(256).max(1536).refine((value) => value % 64 === 0, {
    message: 'Width must be a multiple of 64',
  }),
  height: z.number().int().min(256).max(1536).refine((value) => value % 64 === 0, {
    message: 'Height must be a multiple of 64',
  }),
  steps: z.number().int().min(1).max(50).default(20),
  cfg: z.number().min(1).max(20).default(7),
  sampler: z.string().trim().min(1).max(80).default('euler'),
  seed: z.number().int().min(-1).max(Number.MAX_SAFE_INTEGER).default(-1),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;
