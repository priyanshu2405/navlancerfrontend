import express from "express";
import { createReview, deleteReview, getUserReviews, replyToReview, reportReview, updateReview } from "../controllers/reviews/review.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createReviewSchema,
  getUserReviewsSchema,
  updateReviewSchema,
  reviewParamsSchema,
  replyToReviewSchema,
  reportReviewSchema
} from "../validations/review.validation.js";

const router = express.Router();

router.post("/", authMiddleware, validate(createReviewSchema), createReview);
router.get("/user/:userId", validate(getUserReviewsSchema), getUserReviews);


router.patch(
  "/:reviewId",
  authMiddleware,
  validate(updateReviewSchema),
  updateReview
);

router.delete(
  "/:reviewId",
  authMiddleware,
  validate(reviewParamsSchema),
  deleteReview
);

router.post(
  "/:reviewId/reply",
  authMiddleware,
  validate(replyToReviewSchema),
  replyToReview
);

router.post(
  "/:reviewId/report",
  authMiddleware,
  validate(reportReviewSchema),
  reportReview
);
export default router;
