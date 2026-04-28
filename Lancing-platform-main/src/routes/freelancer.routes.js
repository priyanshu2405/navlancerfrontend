import express from "express";

import {
  upsertProfile,
  getFreelancerProfile,
  searchFreelancers,
  addPortfolio,
  deletePortfolioItem,
  reorderPortfolio,
  updateExperienceLevel,
  updateAvailabilityStatus,
  setFreelancerVerification,
  saveJob,
  removeSavedJob,
  getSavedJobs,
  getMyProfile,
  freelancerStats,
  uploadProfilePicture,
  deleteProfilePicture,
} from "../controllers/freelancers/freelancer.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { upload } from "../utils/upload.js";
import { profilePicUpload } from "../utils/profilePicUpload.js";

import {
  upsertProfileSchema,
  addPortfolioSchema,
  searchFreelancersSchema,
  saveJobSchema,
  getFreelancerProfileSchema,
  deletePortfolioItemSchema,
  reorderPortfolioSchema,
  updateExperienceLevelSchema,
  updateAvailabilityStatusSchema,
  verifyFreelancerSchema
} from "../validations/freelancer.validation.js";

const router = express.Router();

// create / update profile
router.post(
  "/profile",
  authMiddleware,
  roleMiddleware("freelancer"),
  validate(upsertProfileSchema),
  upsertProfile
);

// get own profile
router.get(
  "/profile",
  authMiddleware,
  roleMiddleware("freelancer"),
  getMyProfile
);

// upload/update profile picture
router.post(
  "/profile-picture",
  authMiddleware,
  roleMiddleware("freelancer"),
  profilePicUpload.single("file"),
  uploadProfilePicture
);

// delete profile picture
router.delete(
  "/profile-picture",
  authMiddleware,
  roleMiddleware("freelancer"),
  deleteProfilePicture
);


// add portfolio
router.post(
  "/portfolio",
  authMiddleware,
  roleMiddleware("freelancer"),
  upload.single("file"),
  validate(addPortfolioSchema),
  addPortfolio
);

// search freelancers
router.get("/search", validate(searchFreelancersSchema), searchFreelancers);


// saved jobs Endpoints
router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("freelancer"),
  freelancerStats
);

router.get(
  "/saved-jobs",
  authMiddleware,
  roleMiddleware("freelancer"),
  getSavedJobs
);

router.post(
  "/saved-jobs/:jobId",
  authMiddleware,
  roleMiddleware("freelancer"),
  validate(saveJobSchema),
  saveJob
);

router.delete(
  "/saved-jobs/:jobId",
  authMiddleware,
  roleMiddleware("freelancer"),
  validate(saveJobSchema),
  removeSavedJob
);

/* -------- DYNAMIC ROUTE LAST -------- */

// public freelancer profile
router.get("/:id", validate(getFreelancerProfileSchema), getFreelancerProfile);

router.delete(
  "/portfolio/:portfolioId",
  authMiddleware,
  roleMiddleware("freelancer"),
  validate(deletePortfolioItemSchema),
  deletePortfolioItem
);

router.put(
  "/portfolio/reorder",
  authMiddleware,
  roleMiddleware("freelancer"),
  validate(reorderPortfolioSchema),
  reorderPortfolio
);

router.patch(
  "/experience-level",
  authMiddleware,
  roleMiddleware("freelancer"),
  validate(updateExperienceLevelSchema),
  updateExperienceLevel
);

router.patch(
  "/availability-status",
  authMiddleware,
  roleMiddleware("freelancer"),
  validate(updateAvailabilityStatusSchema),
  updateAvailabilityStatus
);

router.patch(
  "/verify/:freelancerId",
  authMiddleware,
  roleMiddleware("admin"),
  validate(verifyFreelancerSchema),
  setFreelancerVerification
);
export default router;
