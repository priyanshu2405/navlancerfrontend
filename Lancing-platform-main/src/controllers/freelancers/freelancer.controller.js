import FreelancerProfile from "../../models/freelancerProfile.model.js";
import Review from "../../models/review.model.js";
import fs from "fs";
import path from "path";
import Proposal from "../../models/proposal.model.js";
import Contract from "../../models/contract.model.js";


/* CREATE / UPDATE PROFILE */
export const upsertProfile = async (req, res) => {
  try {
    const {
      linkedinUrl,
      resumeUrl,
      category,
      specialties,
      title,
      skills,
      bio,
      hourlyRate,
      experiences,
      education,
      languages,
      dob,
      address,
      phone,
    } = req.body;

    const profile = await FreelancerProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        linkedinUrl,
        resumeUrl,
        category,
        specialties,
        title,
        skills,
        bio,
        hourlyRate,
        experiences,
        education,
        languages,
        dob,
        address,
        phone,
      },
      { new: true, upsert: true }
    );

    res.json({ message: "Profile saved", profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const profile = await FreelancerProfile.findOne({ userId: req.user.id }).populate("userId", "name email");

    // Return empty object if none exists yet
    if (!profile) {
      return res.json({});
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET PUBLIC FREELANCER PROFILE */
export const getFreelancerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const profile = await FreelancerProfile.findOne({ userId: id })
      .populate("userId", "name");

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPLOAD/UPDATE PROFILE PICTURE */
export const uploadProfilePicture = async (req, res) => {
  try {
    let profile = await FreelancerProfile.findOne({
      userId: req.user.id,
    });

    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

    // Create a blank profile if one doesn't exist
    if (!profile) {
      profile = new FreelancerProfile({ userId: req.user.id });
    }

    // Delete old picture if it exists
    if (profile.profilePicture) {
      const oldPath = path.join(process.cwd(), profile.profilePicture);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const newPicUrl = `/uploads/profile-pictures/${req.file.filename}`;
    profile.profilePicture = newPicUrl;

    await profile.save();

    res.json({ message: "Profile picture updated successfully", profilePicture: newPicUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* DELETE PROFILE PICTURE */
export const deleteProfilePicture = async (req, res) => {
  try {
    const profile = await FreelancerProfile.findOne({
      userId: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (profile.profilePicture) {
      const picPath = path.join(process.cwd(), profile.profilePicture);
      if (fs.existsSync(picPath)) {
        fs.unlinkSync(picPath);
      }
    }

    profile.profilePicture = "";
    await profile.save();

    res.json({ message: "Profile picture deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPDATE RATING (INTERNAL USE) */
export const updateRating = async (freelancerId) => {
  const reviews = await Review.find({ toUser: freelancerId });

  if (!reviews.length) return;

  const avg =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await FreelancerProfile.findOneAndUpdate(
    { userId: freelancerId },
    {
      userId: freelancerId,
      averageRating: Number(avg.toFixed(1)),
      totalReviews: reviews.length,
    },
    { upsert: true, new: true }
  );

};

/* SEARCH FREELANCERS */
export const searchFreelancers = async (req, res) => {
  try {
    const {
      skill,
      minRating = 0,
      minRate = 0,
      maxRate = 100000,
      availabilityStatus,
      experienceLevel,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {
      averageRating: { $gte: Number(minRating) },
      hourlyRate: {
        $gte: Number(minRate),
        $lte: Number(maxRate),
      },
    };

    if (skill) {
      filter.skills = { $regex: skill, $options: "i" };
    }

    if (availabilityStatus) {
      filter.availabilityStatus = availabilityStatus;
    }

    if (experienceLevel) {
      filter.experienceLevel = experienceLevel;
    }

    const freelancers = await FreelancerProfile.find(filter)
      .populate("userId", "name")
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json(freelancers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addPortfolio = async (req, res) => {
  try {
    const profile = await FreelancerProfile.findOne({
      userId: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    profile.portfolio.push({
      title: req.body.title,
      fileUrl: `/uploads/portfolio/${req.file.filename}`,
    });

    await profile.save();

    res.json({ message: "Portfolio added", portfolio: profile.portfolio });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const deletePortfolioItem = async (req, res) => {
  try {
    const { portfolioId } = req.params;

    const profile = await FreelancerProfile.findOne({
      userId: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const item = profile.portfolio.find(
      (p) => p._id.toString() === portfolioId
    );

    if (!item) {
      return res.status(404).json({ message: "Portfolio item not found" });
    }

    //  delete file from disk
    const filePath = path.join(process.cwd(), item.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    //  remove from array (mongoose-safe)
    profile.portfolio.pull({ _id: portfolioId });
    await profile.save();

    res.json({ message: "Portfolio item deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const reorderPortfolio = async (req, res) => {
  try {
    const { order } = req.body;

    if (!Array.isArray(order)) {
      return res.status(400).json({ message: "Order must be an array" });
    }

    const profile = await FreelancerProfile.findOne({
      userId: req.user.id,
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Validate same items count
    if (order.length !== profile.portfolio.length) {
      return res.status(400).json({
        message: "Order items count mismatch",
      });
    }

    // Map existing items
    const map = {};
    profile.portfolio.forEach((item) => {
      map[item._id.toString()] = item;
    });

    // Build new ordered array
    const reordered = [];
    for (const id of order) {
      if (!map[id]) {
        return res.status(400).json({
          message: "Invalid portfolio item in order",
        });
      }
      reordered.push(map[id]);
    }

    profile.portfolio = reordered;
    await profile.save();

    res.json({
      message: "Portfolio reordered successfully",
      portfolio: profile.portfolio,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const updateExperienceLevel = async (req, res) => {
  try {
    const { experienceLevel } = req.body;

    const allowed = ["beginner", "intermediate", "expert"];
    if (!allowed.includes(experienceLevel)) {
      return res.status(400).json({
        message: "Invalid experience level",
      });
    }

    const profile = await FreelancerProfile.findOneAndUpdate(
      { userId: req.user.id },
      { experienceLevel },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({
      message: "Experience level updated",
      experienceLevel: profile.experienceLevel,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const updateAvailabilityStatus = async (req, res) => {
  try {
    const { availabilityStatus } = req.body;

    const allowed = ["available", "busy", "unavailable"];
    if (!allowed.includes(availabilityStatus)) {
      return res.status(400).json({
        message: "Invalid availability status",
      });
    }

    const profile = await FreelancerProfile.findOneAndUpdate(
      { userId: req.user.id },
      { availabilityStatus },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({
      message: "Availability status updated",
      availabilityStatus: profile.availabilityStatus,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const setFreelancerVerification = async (req, res) => {
  try {
    const { freelancerId } = req.params;
    const { isVerified } = req.body;

    const profile = await FreelancerProfile.findOne({ userId: freelancerId });

    if (!profile) {
      return res.status(404).json({ message: "Freelancer profile not found" });
    }

    profile.isVerified = Boolean(isVerified);
    profile.verifiedAt = isVerified ? new Date() : null;

    await profile.save();

    res.json({
      message: `Freelancer ${isVerified ? "verified" : "unverified"
        } successfully`,
      isVerified: profile.isVerified,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* SAVE JOB (BOOKMARK) */
export const saveJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    let profile = await FreelancerProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (profile.savedJobs.includes(jobId)) {
      return res.status(400).json({ message: "Job is already saved" });
    }

    profile.savedJobs.push(jobId);
    await profile.save();

    res.json({
      message: "Job saved successfully",
      savedJobs: profile.savedJobs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* REMOVE SAVED JOB */
export const removeSavedJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const profile = await FreelancerProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (!profile.savedJobs.includes(jobId)) {
      return res.status(400).json({ message: "Job is not in your saved list" });
    }

    profile.savedJobs = profile.savedJobs.filter(
      (id) => id.toString() !== jobId
    );

    await profile.save();

    res.json({
      message: "Job removed from saved list",
      savedJobs: profile.savedJobs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET ALL SAVED JOBS */
export const getSavedJobs = async (req, res) => {
  try {
    const profile = await FreelancerProfile.findOne({
      userId: req.user.id,
    }).populate({
      path: "savedJobs",
      select: "title budget category status type createdAt",
      populate: { path: "clientId", select: "name" },
    });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({ savedJobs: profile.savedJobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* FREELANCER STATS */
export const freelancerStats = async (req, res) => {
  try {
    const freelancerId = req.user.id;

    // 1. Total Proposals Sent
    const totalProposals = await Proposal.countDocuments({ freelancerId });

    // 2. Active Contracts
    const activeContracts = await Contract.countDocuments({
      freelancerId,
      status: "active",
    });

    // 3. Completed Contracts & Total Earnings
    const completedContractsDetails = await Contract.find({
      freelancerId,
      status: "completed",
    }).populate("jobId", "budget");

    const completedContracts = completedContractsDetails.length;

    // Sum budget of all completed jobs 
    const totalEarnings = completedContractsDetails.reduce(
      (sum, contract) => sum + (contract.jobId?.budget || 0),
      0
    );

    res.json({
      stats: {
        totalProposals,
        activeContracts,
        completedContracts,
        totalEarnings,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
