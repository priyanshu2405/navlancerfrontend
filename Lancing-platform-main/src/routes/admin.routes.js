import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  updateAdminProfileSchema,
  paginationQuerySchema,
  adminUserParamsSchema,
  resolveReportSchema,
  updateJobStatusAdminSchema,
  moderateJobSchema,
  deleteProposalAdminSchema,
  resolveDisputeAdminSchema,
  broadcastNotificationSchema,
  moderateReviewSchema,
  createTaxonomySchema,
  taxonomyParamsSchema,
  replyToTicketAdminSchema
} from "../validations/admin.validation.js";

import {
  getPlatformStats,
  getAllUsers,
  toggleUserBlockStatus,
  moderateJob,
  getDisputedContracts,
  verifyUser,
  resolveDispute,
  broadcastNotification,
  getAllReviewsAdmin,
  moderateReview,
  getAllJobsAdmin,
  updateJobStatusAdmin,
  getAllProposalsAdmin,
  deleteProposalAdmin,
  getAllAuditLogs,
  getAdminProfile,
  updateAdminProfile,
  createSkill,
  getAllSkills,
  deleteSkill,
  createCategory,
  getAllCategories,
  deleteCategory,
  getAllTickets,
  replyToTicket,
  getAllUserReports,
  updateReportStatus
} from "../controllers/admin/admin.controller.js";

const router = express.Router();

router.use(authMiddleware, roleMiddleware("admin"));

// Admin Profile
router.get("/profile", getAdminProfile);
router.patch("/profile", validate(updateAdminProfileSchema), updateAdminProfile);

// View Platform Stats
router.get("/stats", getPlatformStats);

// User Management
router.get("/users", validate(paginationQuerySchema), getAllUsers);
router.patch("/users/:userId/block", validate(adminUserParamsSchema), toggleUserBlockStatus);
router.patch("/users/:userId/verify", validate(adminUserParamsSchema), verifyUser);

// User Reports Management
router.get("/reports", validate(paginationQuerySchema), getAllUserReports);
router.patch("/reports/:reportId/resolve", validate(resolveReportSchema), updateReportStatus);

// Job Moderation
router.get("/jobs", validate(paginationQuerySchema), getAllJobsAdmin);
router.patch("/jobs/:jobId/status", validate(updateJobStatusAdminSchema), updateJobStatusAdmin);
router.delete("/jobs/:jobId", validate(moderateJobSchema), moderateJob);

// Proposal Moderation
router.get("/proposals", validate(paginationQuerySchema), getAllProposalsAdmin);
router.delete("/proposals/:proposalId", validate(deleteProposalAdminSchema), deleteProposalAdmin);

// Disputes
router.get("/disputes", getDisputedContracts);
router.post("/disputes/:contractId/resolve", validate(resolveDisputeAdminSchema), resolveDispute);

// System Notifications
router.post("/notifications/broadcast", validate(broadcastNotificationSchema), broadcastNotification);

// Reviews Moderation
router.get("/reviews", validate(paginationQuerySchema), getAllReviewsAdmin);
router.patch("/reviews/:reviewId/moderate", validate(moderateReviewSchema), moderateReview);

// Taxonomy (Skills & Categories)
router.post("/skills", validate(createTaxonomySchema), createSkill);
router.get("/skills", getAllSkills);
router.delete("/skills/:id", validate(taxonomyParamsSchema), deleteSkill);

router.post("/categories", validate(createTaxonomySchema), createCategory);
router.get("/categories", getAllCategories);
router.delete("/categories/:id", validate(taxonomyParamsSchema), deleteCategory);

// Support Tickets
router.get("/tickets", validate(paginationQuerySchema), getAllTickets);
router.patch("/tickets/:ticketId/reply", validate(replyToTicketAdminSchema), replyToTicket);

// Audit Logs
router.get("/audit-logs", getAllAuditLogs);

export default router;
