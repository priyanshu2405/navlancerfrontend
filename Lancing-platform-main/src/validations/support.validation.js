import { z } from "zod";

export const createTicketSchema = z.object({
    body: z.object({
        subject: z.string().min(5, "Subject must be at least 5 characters long").max(100),
        message: z.string().min(10, "Message must be at least 10 characters long").max(2000),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    }),
});
