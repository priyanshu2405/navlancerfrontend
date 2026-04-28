import { z } from "zod";

export const createJobSchema = z.object({
    body: z.object({
        title: z.string().min(5, "Title must be at least 5 characters"),
        description: z.string().min(10, "Description must be at least 10 characters"),
        budget: z.coerce.number().positive("Budget must be a positive number"),
        category: z.string().min(1, "Category is required"),
        tags: z.array(z.string()).optional(),
        expiryDate: z.string().datetime().or(z.date()),
        isRemote: z.coerce.boolean().optional(),
        country: z.string().optional(),
        language: z.string().optional(),
        visibility: z.enum(["public", "private"]).optional(),
        invitedFreelancers: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid freelancer ID format")).optional(),
    }),
});

export const updateJobSchema = z.object({
    body: z.object({
        title: z.string().min(5, "Title must be at least 5 characters").optional(),
        description: z.string().min(10, "Description must be at least 10 characters").optional(),
        budget: z.coerce.number().positive("Budget must be a positive number").optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        expiryDate: z.string().datetime().or(z.date()).optional(),
        isRemote: z.coerce.boolean().optional(),
        country: z.string().optional(),
        language: z.string().optional(),
        visibility: z.enum(["public", "private"]).optional(),
        invitedFreelancers: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid freelancer ID format")).optional(),
    }),
});

export const reopenJobSchema = z.object({
    body: z.object({
        expiryDate: z.string().datetime().or(z.date()).optional(),
    }),
    params: z.object({
        jobId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Job ID format"),
    }),
});

export const reportJobSchema = z.object({
    body: z.object({
        reason: z.string().min(5, "Reason must be at least 5 characters"),
    }),
    params: z.object({
        jobId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Job ID format"),
    }),
});

export const duplicateJobSchema = z.object({
    params: z.object({
        jobId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Job ID format"),
    }),
});

export const inviteFreelancerSchema = z.object({
    params: z.object({
        jobId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Job ID format"),
        freelancerId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Freelancer ID format"),
    }),
});

export const jobParamsSchema = z.object({
    params: z.object({
        id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Job ID format"),
    }),
});
