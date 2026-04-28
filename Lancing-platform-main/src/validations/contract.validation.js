import { z } from "zod";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const contractParamsSchema = z.object({
    params: z.object({
        contractId: z.string().regex(objectIdPattern, "Invalid Contract ID format"),
    }),
});

export const requestCancelContractSchema = z.object({
    params: z.object({
        contractId: z.string().regex(objectIdPattern, "Invalid Contract ID format"),
    }),
    body: z.object({
        reason: z.string().min(5, "Reason must be at least 5 characters"),
    }),
});

export const requestExtensionSchema = z.object({
    params: z.object({
        contractId: z.string().regex(objectIdPattern, "Invalid Contract ID format"),
    }),
    body: z.object({
        newDeadline: z.string().datetime().or(z.date()),
        reason: z.string().min(5, "Reason must be at least 5 characters"),
    }),
});

export const raiseDisputeSchema = z.object({
    params: z.object({
        contractId: z.string().regex(objectIdPattern, "Invalid Contract ID format"),
    }),
    body: z.object({
        reason: z.string().min(5, "Reason must be at least 5 characters"),
    }),
});

export const addMilestoneSchema = z.object({
    params: z.object({
        contractId: z.string().regex(objectIdPattern, "Invalid Contract ID format"),
    }),
    body: z.object({
        title: z.string().min(3, "Title must be at least 3 characters"),
        description: z.string().min(5, "Description must be at least 5 characters"),
        dueDate: z.string().datetime().or(z.date()),
    }),
});

export const milestoneParamsSchema = z.object({
    params: z.object({
        contractId: z.string().regex(objectIdPattern, "Invalid Contract ID format"),
        milestoneId: z.string().regex(objectIdPattern, "Invalid Milestone ID format"),
    }),
});

export const updateMilestoneSchema = z.object({
    params: z.object({
        contractId: z.string().regex(objectIdPattern, "Invalid Contract ID format"),
        milestoneId: z.string().regex(objectIdPattern, "Invalid Milestone ID format"),
    }),
    body: z.object({
        status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
    }),
});
