import { z } from "zod";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

export const updateAdminProfileSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        email: z.string().email().optional(),
        oldPassword: z.string().min(6).optional(),
        newPassword: z.string().min(6).optional(),
    }).refine((data) => {
        if (data.newPassword && !data.oldPassword) return false;
        return true;
    }, {
        message: "Old password is required to set a new password",
        path: ["oldPassword"],
    }),
});

export const paginationQuerySchema = z.object({
    query: z.object({
        page: z.coerce.number().min(1).optional(),
        limit: z.coerce.number().min(1).optional(),
        role: z.string().optional(),
        search: z.string().optional(),
        status: z.string().optional(),
        reason: z.string().optional(),
        isDeleted: z.string().optional(),
        isReported: z.string().optional(),
        priority: z.string().optional(),
    }),
});

export const adminUserParamsSchema = z.object({
    params: z.object({
        userId: z.string().regex(objectIdPattern, "Invalid User ID format"),
    }),
});

export const resolveReportSchema = z.object({
    params: z.object({
        reportId: z.string().regex(objectIdPattern, "Invalid Report ID format"),
    }),
    body: z.object({
        status: z.enum(["investigated", "closed"]),
        adminNotes: z.string().optional(),
    }),
});

export const updateJobStatusAdminSchema = z.object({
    params: z.object({
        jobId: z.string().regex(objectIdPattern, "Invalid Job ID format"),
    }),
    body: z.object({
        status: z.string().optional(),
        isDeleted: z.boolean().optional(),
    }),
});

export const moderateJobSchema = z.object({
    params: z.object({
        jobId: z.string().regex(objectIdPattern, "Invalid Job ID format"),
    }),
});

export const deleteProposalAdminSchema = z.object({
    params: z.object({
        proposalId: z.string().regex(objectIdPattern, "Invalid Proposal ID format"),
    }),
});

export const resolveDisputeAdminSchema = z.object({
    params: z.object({
        contractId: z.string().regex(objectIdPattern, "Invalid Contract ID format"),
    }),
    body: z.object({
        resolution: z.enum(["resolved", "rejected"]),
        adminNotes: z.string().optional(),
    }),
});

export const broadcastNotificationSchema = z.object({
    body: z.object({
        message: z.string().min(1, "Message is required"),
        targetRole: z.enum(["client", "freelancer"]).optional(),
    }),
});

export const moderateReviewSchema = z.object({
    params: z.object({
        reviewId: z.string().regex(objectIdPattern, "Invalid Review ID format"),
    }),
    body: z.object({
        action: z.enum(["delete", "restore"]),
    }),
});

export const createTaxonomySchema = z.object({
    body: z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
    }),
});

export const taxonomyParamsSchema = z.object({
    params: z.object({
        id: z.string().regex(objectIdPattern, "Invalid ID format"),
    }),
});

export const replyToTicketAdminSchema = z.object({
    params: z.object({
        ticketId: z.string().regex(objectIdPattern, "Invalid Ticket ID format"),
    }),
    body: z.object({
        reply: z.string().min(1, "Reply message is required").optional(),
        message: z.string().min(1, "Message is required").optional(),
    }),
});
