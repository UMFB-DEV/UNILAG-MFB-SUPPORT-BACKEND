import { z } from "zod";

const createCommentSchema = z.object({
  message: z.string().min(1),
  isInternal: z.boolean().optional().default(false),
});

export { createCommentSchema };
