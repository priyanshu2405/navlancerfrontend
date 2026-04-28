import { z } from "zod";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const sendMessageSchema = z.object({
    body: z.object({
        contractId: z.string().regex(objectIdPattern, "Invalid Contract ID format"),
        message: z.string().min(1, "Message cannot be empty").max(2000, "Message is too long"),
    }),
});

export const getMessagesSchema = z.object({
    params: z.object({
        contractId: z.string().regex(objectIdPattern, "Invalid Contract ID format"),
    }),
});
