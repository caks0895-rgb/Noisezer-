import { z } from 'zod';

export const NTIRequestSchema = z.object({
  ca: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid contract address format"),
  optional_name: z.string().optional()
});

export const NTIResponseSchema = z.object({
  nti_score: z.number().min(0).max(100),
  verdict: z.enum(['ALPHA_SIGNAL', 'NEUTRAL', 'BS_SIGNAL']),
  data: z.object({
    on_chain: z.object({
      score: z.number(),
      breakdown: z.record(z.string(), z.any())
    }),
    off_chain: z.object({
      score: z.number(),
      breakdown: z.record(z.string(), z.any())
    })
  }),
  disclaimer: z.string()
});

export type NTIRequest = z.infer<typeof NTIRequestSchema>;
export type NTIResponse = z.infer<typeof NTIResponseSchema>;
