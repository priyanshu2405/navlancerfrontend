import { z } from "zod";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const upsertProfileSchema = z.object({
    body: z.object({
        // Intro Section
        linkedinUrl: z.string().url().optional().or(z.literal("")),
        resumeUrl: z.string().url().optional().or(z.literal("")),
        // Category Selection
        category: z.string().optional(),
        specialties: z.array(z.string()).optional(),
        // Professional Details
        title: z.string().optional(),
        skills: z.array(z.string()).min(1, "At least one skill is required"),
        bio: z.string().optional(),
        hourlyRate: z.coerce.number().positive("Hourly rate must be a positive number"),
        // Experience Details
        experiences: z.array(z.object({
            company: z.string().min(1, "Company is required"),
            position: z.string().min(1, "Position is required"),
            startDate: z.coerce.date(),
            endDate: z.coerce.date().optional(),
            current: z.boolean().optional(),
            description: z.string().optional(),
        })).optional(),
        // Education Details
        education: z.array(z.object({
            institution: z.string().min(1, "Institution is required"),
            degree: z.string().min(1, "Degree is required"),
            fieldOfStudy: z.string().min(1, "Field of study is required"),
            startDate: z.coerce.date(),
            endDate: z.coerce.date().optional(),
            current: z.boolean().optional(),
            description: z.string().optional(),
        })).optional(),
        // Language Details
        languages: z.array(z.object({
            language: z.string().min(1, "Language is required"),
            proficiency: z.enum(["beginner", "intermediate", "advanced", "native"]).optional(),
        })).optional(),
        // Location Details
        dob: z.coerce.date().optional(),
        address: z.object({
            street: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zip: z.string().optional(),
            country: z.string().optional(),
        }).optional(),
        phone: z.string().optional(),
    }),
});

export const addPortfolioSchema = z.object({
    body: z.object({
        title: z.string().min(3, "Title must be at least 3 characters").max(100),
    }),
});

export const searchFreelancersSchema = z.object({
    query: z.object({
        skill: z.string().optional(),
        minRating: z.coerce.number().min(0).max(5).optional(),
        minRate: z.coerce.number().min(0).optional(),
        maxRate: z.coerce.number().min(0).optional(),
        availabilityStatus: z.enum(["available", "busy", "unavailable"]).optional(),
        experienceLevel: z.enum(["beginner", "intermediate", "expert"]).optional(),
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).optional(),
    }),
});

export const saveJobSchema = z.object({
    params: z.object({
        jobId: z.string().regex(objectIdPattern, "Invalid Job ID format"),
    }),
});

export const getFreelancerProfileSchema = z.object({
    params: z.object({
        id: z.string().regex(objectIdPattern, "Invalid User ID format"),
    }),
});

export const deletePortfolioItemSchema = z.object({
    params: z.object({
        portfolioId: z.string().regex(objectIdPattern, "Invalid Portfolio ID format"),
    }),
});

export const reorderPortfolioSchema = z.object({
    body: z.object({
        order: z.array(z.string().regex(objectIdPattern, "Invalid Portfolio ID format")).min(1, "Order array cannot be empty"),
    }),
});

export const updateExperienceLevelSchema = z.object({
    body: z.object({
        experienceLevel: z.enum(["beginner", "intermediate", "expert"]),
    }),
});

export const updateAvailabilityStatusSchema = z.object({
    body: z.object({
        availabilityStatus: z.enum(["available", "busy", "unavailable"]),
    }),
});

export const verifyFreelancerSchema = z.object({
    params: z.object({
        freelancerId: z.string().regex(objectIdPattern, "Invalid Freelancer ID format"),
    }),
    body: z.object({
        isVerified: z.boolean(),
    }),
});
