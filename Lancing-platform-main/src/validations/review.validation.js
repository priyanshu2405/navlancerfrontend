import { z } from "zod";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const createReviewSchema = z.object({
    body: z.object({
        contractId: z.string().regex(objectIdPattern, "Invalid Contract ID format"),
        rating: z.coerce.number().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5"),
        comment: z.string().min(10, "Comment must be at least 10 characters long").max(1000, "Comment is too long"),
    }),
});

export const getUserReviewsSchema = z.object({
    params: z.object({
        userId: z.string().regex(objectIdPattern, "Invalid User ID format"),
    }),
});

export const updateReviewSchema = z.object({
    params: z.object({
        reviewId: z.string().regex(objectIdPattern, "Invalid Review ID format"),
    }),
    body: z.object({
        rating: z.coerce.number().min(1, "Rating must be between 1 and 5").max(5, "Rating must be between 1 and 5").optional(),
        comment: z.string().min(10, "Comment must be at least 10 characters long").max(1000, "Comment is too long").optional(),
    }),
});

export const reviewParamsSchema = z.object({
    params: z.object({
        reviewId: z.string().regex(objectIdPattern, "Invalid Review ID format"),
    }),
});

export const replyToReviewSchema = z.object({
    params: z.object({
        reviewId: z.string().regex(objectIdPattern, "Invalid Review ID format"),
    }),
    body: z.object({
        message: z.string().min(5, "Reply must be at least 5 characters long").max(1000, "Reply is too long"),
    }),
});

export const reportReviewSchema = z.object({
    params: z.object({
        reviewId: z.string().regex(objectIdPattern, "Invalid Review ID format"),
    }),
    body: z.object({
        reason: z.string().min(5, "Reason must be at least 5 characters long").max(500, "Reason is too long"),
    }),
});
