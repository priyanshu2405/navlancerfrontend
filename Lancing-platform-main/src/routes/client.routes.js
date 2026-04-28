import express from "express";

import {
  blockFreelancer,
  clientDashboard,
  clientRating,
  clientStats,
  clientTrustScore,
  favoriteFreelancer,
  getClientPreferences,
  getClientProfile,
  removeFavoriteFreelancer,
  unblockFreelancer,
  upsertClientProfile,
  getSavedFreelancers,
  getMyProfile,
  uploadProfilePicture,
  deleteProfilePicture
} from "../controllers/clients/client.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { profilePicUpload } from "../utils/profilePicUpload.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  upsertClientProfileSchema,
  clientParamsSchema,
  freelancerParamsSchema
} from "../validations/client.validation.js";

const router = express.Router();

router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware("client"),
  clientDashboard
);


// create / update profile
router.post(
  "/profile",
  authMiddleware,
  roleMiddleware("client"),
  validate(upsertClientProfileSchema),
  upsertClientProfile
);

// get own profile 
router.get(
  "/profile",
  authMiddleware,
  roleMiddleware("client"),
  getMyProfile
);

// upload/update profile picture
router.post(
  "/profile-picture",
  authMiddleware,
  roleMiddleware("client"),
  profilePicUpload.single("file"),
  uploadProfilePicture
);

// delete profile picture
router.delete(
  "/profile-picture",
  authMiddleware,
  roleMiddleware("client"),
  deleteProfilePicture
);

// public client profile
router.get(
  "/profile/:clientId",
  validate(clientParamsSchema),
  getClientProfile
);



/* CLIENT STATS */
router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("client"),
  clientStats
);

/* PUBLIC CLIENT RATING */
router.get(
  "/rating/:clientId",
  validate(clientParamsSchema),
  clientRating
);


router.get(
  "/trust/:clientId",
  validate(clientParamsSchema),
  clientTrustScore
);


router.post(
  "/block/:freelancerId",
  authMiddleware,
  roleMiddleware("client"),
  validate(freelancerParamsSchema),
  blockFreelancer
);

router.post(
  "/unblock/:freelancerId",
  authMiddleware,
  roleMiddleware("client"),
  validate(freelancerParamsSchema),
  unblockFreelancer
);

router.post(
  "/favorite/:freelancerId",
  authMiddleware,
  roleMiddleware("client"),
  validate(freelancerParamsSchema),
  favoriteFreelancer
);

router.post(
  "/favorite/remove/:freelancerId",
  authMiddleware,
  roleMiddleware("client"),
  validate(freelancerParamsSchema),
  removeFavoriteFreelancer
);

router.get(
  "/preferences",
  authMiddleware,
  roleMiddleware("client"),
  getClientPreferences
);

router.get(
  "/saved-freelancers",
  authMiddleware,
  roleMiddleware("client"),
  getSavedFreelancers
);

export default router;
