import { z } from "zod";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const sendProposalSchema = z.object({
    body: z.object({
        jobId: z.string().regex(objectIdPattern, "Invalid Job ID format"),
        coverLetter: z.string().min(10, "Cover letter must be at least 10 characters"),
        price: z.coerce.number().positive("Price must be a positive number"),
    }),
});

export const getProposalsByJobSchema = z.object({
    params: z.object({
        jobId: z.string().regex(objectIdPattern, "Invalid Job ID format"),
    }),
    query: z.object({
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).optional(),
    }),
});

export const proposalParamsSchema = z.object({
    params: z.object({
        proposalId: z.string().regex(objectIdPattern, "Invalid Proposal ID format"),
    }),
});

export const editProposalSchema = z.object({
    params: z.object({
        proposalId: z.string().regex(objectIdPattern, "Invalid Proposal ID format"),
    }),
    body: z.object({
        coverLetter: z.string().min(10, "Cover letter must be at least 10 characters").optional(),
        price: z.coerce.number().positive("Price must be a positive number").optional(),
    }),
});

export const addClientNoteSchema = z.object({
    params: z.object({
        proposalId: z.string().regex(objectIdPattern, "Invalid Proposal ID format"),
    }),
    body: z.object({
        note: z.string().min(1, "Note cannot be empty"),
    }),
});

export const searchProposalsSchema = z.object({
    query: z.object({
        keyword: z.string().min(1, "Keyword is required").optional(),
    }),
});

export const acceptInviteSchema = z.object({
    params: z.object({
        proposalId: z.string().regex(objectIdPattern, "Invalid Proposal ID format"),
    }),
    body: z.object({
        coverLetter: z.string().min(10, "Cover letter must be at least 10 characters"),
        price: z.coerce.number().positive("Price must be a positive number"),
    }),
});
