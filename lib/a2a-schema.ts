import { z } from 'zod';

export const AlphaReportSchema = z.object({
  type: z.literal('TRUTH_REPORT'),
  nti_score: z.number().min(0).max(100),
  verdict: z.string(),
  data_points: z.object({
    liquidity: z.string(),
    holders: z.number(),
    age: z.string(),
  }),
  rationale: z.string(),
  disclaimer: z.string(),
  last_updated: z.string(),
});

export type AlphaReport = z.infer<typeof AlphaReportSchema>;

export const ErrorResponseSchema = z.object({
  status: z.literal('error'),
  code: z.string(),
  message: z.string(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
