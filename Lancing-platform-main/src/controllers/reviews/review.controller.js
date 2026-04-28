import Review from "../../models/review.model.js";
import Contract from "../../models/contract.model.js";
import User from "../../models/user.model.js";
import { updateRating } from "../freelancers/freelancer.controller.js";
import { updateClientRating } from "../clients/client.controller.js";

// Helper function to update the correct profile
const updateTargetUserRating = async (toUserId) => {
  const targetUser = await User.findById(toUserId);
  if (!targetUser) return;

  if (targetUser.role === "freelancer") {
    await updateRating(toUserId);
  } else if (targetUser.role === "client") {
    await updateClientRating(toUserId);
  }
};

/* CREATE REVIEW */
export const createReview = async (req, res) => {
  try {
    const { contractId, rating, comment } = req.body;

    const contract = await Contract.findById(contractId);
    if (!contract || contract.status !== "completed") {
      return res.status(400).json({ message: "Contract not completed" });
    }

    // only client or freelancer
    if (
      contract.clientId.toString() !== req.user.id &&
      contract.freelancerId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const toUser =
      req.user.id === contract.clientId.toString()
        ? contract.freelancerId
        : contract.clientId;

    const exists = await Review.findOne({
      contractId,
      fromUser: req.user.id,
    });
    if (exists) {
      return res.status(400).json({ message: "Review already given" });
    }

    const review = await Review.create({
      contractId,
      fromUser: req.user.id,
      toUser,
      rating,
      comment,
    });

    // Update the average rating for the target user securely
    await updateTargetUserRating(toUser);

    res.status(201).json({ message: "Review submitted", review });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* GET REVIEWS OF A USER (PUBLIC) */
export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ toUser: userId })
      .populate("fromUser", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* UPDATE REVIEW */
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.fromUser.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (review.isDeleted) {
      return res.status(400).json({ message: "Review already deleted" });
    }

    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    await review.save();

    // Recalculate rating because an old rating might have been edited
    await updateTargetUserRating(review.toUser);

    res.json({ message: "Review updated successfully", review });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* DELETE REVIEW */
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (review.fromUser.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    review.isDeleted = true;
    await review.save();

    // Recalculate rating because a review is now removed
    await updateTargetUserRating(review.toUser);

    res.json({ message: "Review deleted successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* REPLY TO REVIEW */
export const replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { message } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.reply = {
      message,
      repliedBy: req.user.id,
      repliedAt: new Date(),
    };

    await review.save();

    res.json({ message: "Reply added successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* REPORT REVIEW */
export const reportReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.isReported = true;
    review.reportReason = reason;

    await review.save();

    res.json({ message: "Review reported successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
