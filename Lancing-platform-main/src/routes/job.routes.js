import express from "express";
import {
  createJob,
  getJobs,
  getJobById,
  deleteJob,
  updateJob,
  reopenJob,
  duplicateJob,
  searchJobs,
  reportJob,
  inviteFreelancer
} from "../controllers/jobs/job.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { jobUpload } from "../utils/jobUpload.js";
import {
  createJobSchema,
  updateJobSchema,
  reopenJobSchema,
  reportJobSchema,
  duplicateJobSchema,
  inviteFreelancerSchema,
  jobParamsSchema
} from "../validations/job.validation.js";

const router = express.Router();

/* Client creates job */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("client"),
  jobUpload.single("file"),
  validate(createJobSchema),
  createJob
);

/* Freelancer browses jobs */
router.get(
  "/",
  authMiddleware,
  roleMiddleware("freelancer"),
  getJobs
);

/* SEARCH JOBS */
router.get(
  "/search",
  authMiddleware,
  roleMiddleware("freelancer"),
  searchJobs
);

/* Any logged-in user can view a job */
router.get(
  "/:id",
  authMiddleware,
  validate(jobParamsSchema),
  getJobById
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("client"),
  validate(updateJobSchema),
  updateJob
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("client"),
  validate(jobParamsSchema),
  deleteJob
);

router.patch(
  "/:jobId/reopen",
  authMiddleware,
  roleMiddleware("client"),
  validate(reopenJobSchema),
  reopenJob
);

router.post(
  "/:jobId/duplicate",
  authMiddleware,
  roleMiddleware("client"),
  validate(duplicateJobSchema),
  duplicateJob
);

router.post(
  "/:jobId/report",
  authMiddleware,
  validate(reportJobSchema),
  reportJob
);

router.post(
  "/:jobId/invite/:freelancerId",
  authMiddleware,
  roleMiddleware("client"),
  validate(inviteFreelancerSchema),
  inviteFreelancer
);

export default router;
