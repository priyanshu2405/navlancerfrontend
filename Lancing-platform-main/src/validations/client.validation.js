import { z } from "zod";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const upsertClientProfileSchema = z.object({
    body: z.object({
        companyName: z.string().min(2, "Company name must be at least 2 characters").optional(),
        industry: z.string().optional(),
        about: z.string().max(1000, "About section is too long").optional(),
        website: z.string().url("Invalid website URL").optional().or(z.literal("")),
        location: z.string().optional(),
        foundedYear: z.coerce.number().min(1800).max(new Date().getFullYear()).optional(),
    }),
});

export const clientParamsSchema = z.object({
    params: z.object({
        clientId: z.string().regex(objectIdPattern, "Invalid Client ID format"),
    }),
});

export const freelancerParamsSchema = z.object({
    params: z.object({
        freelancerId: z.string().regex(objectIdPattern, "Invalid Freelancer ID format"),
    }),
});
