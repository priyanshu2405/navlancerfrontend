import { z } from "zod";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const reportUserSchema = z.object({
    params: z.object({
        userId: z.string().regex(objectIdPattern, "Invalid User ID format"),
    }),
    body: z.object({
        reason: z.string().min(3, "Reason must be at least 3 characters").max(100),
        description: z.string().min(10, "Description must be at least 10 characters").max(2000),
    }),
});
