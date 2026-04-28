import Job from "../../models/job.model.js";
import Proposal from "../../models/proposal.model.js";
import Contract from "../../models/contract.model.js";
import Review from "../../models/review.model.js";
import User from "../../models/user.model.js";
import clientProfileModel from "../../models/clientProfile.model.js";
import fs from "fs";
import path from "path";

export const clientDashboard = async (req, res) => {
  try {
    const clientId = req.user.id;

    const jobs = await Job.find({ clientId });

    const jobIds = jobs.map((j) => j._id);

    const proposalsCount = await Proposal.countDocuments({
      jobId: { $in: jobIds },
    });

    const activeContracts = await Contract.countDocuments({
      clientId,
      status: "active",
    });

    const completedContracts = await Contract.countDocuments({
      clientId,
      status: "completed",
    });

    res.json({
      stats: {
        totalJobs: jobs.length,
        totalProposals: proposalsCount,
        activeContracts,
        completedContracts,
      },
      jobs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const upsertClientProfile = async (req, res) => {
  try {
    const profile = await clientProfileModel.findOneAndUpdate(
      { userId: req.user.id },
      { ...req.body },
      { new: true, upsert: true }
    );

    res.json({
      message: "Client profile saved successfully",
      profile,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getMyProfile = async (req, res) => {
  try {
    const profile = await clientProfileModel.findOne({ userId: req.user.id }).populate("userId", "name email");

    // Return empty object or default profile if none exists yet, so frontend doesn't crash
    if (!profile) {
      return res.json({});
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET PUBLIC CLIENT PROFILE */
export const getClientProfile = async (req, res) => {
  try {
    const { clientId } = req.params;

    const profile = await clientProfileModel.findOne({ userId: clientId })
      .populate("userId", "name");

    if (!profile) {
      return res.status(404).json({ message: "Client profile not found" });
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* UPLOAD/UPDATE PROFILE PICTURE */
export const uploadProfilePicture = async (req, res) => {
  try {
    let profile = await clientProfileModel.findOne({
      userId: req.user.id,
    });

    if (!req.file) {
      return res.status(400).json({ message: "Please upload an image" });
    }

    // Create a blank profile if one doesn't exist
    if (!profile) {
      profile = new clientProfileModel({ userId: req.user.id });
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
    const profile = await clientProfileModel.findOne({
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

/* UPDATE CLIENT RATING (INTERNAL USE) */
export const updateClientRating = async (clientId) => {
  const reviews = await Review.find({ toUser: clientId });

  if (!reviews.length) return;

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await clientProfileModel.findOneAndUpdate(
    { userId: clientId },
    {
      userId: clientId,
      averageRating: Number(avg.toFixed(1)),
      totalReviews: reviews.length,
    },
    { upsert: true, new: true }
  );
};

/* CLIENT HIRING HISTORY & STATS */
export const clientStats = async (req, res) => {
  try {
    const clientId = req.user.id;

    // 🔹 Jobs
    const jobs = await Job.find({ clientId })
      .select("title status budget createdAt")
      .sort({ createdAt: -1 });

    const openJobs = jobs.filter((j) => j.status === "open");
    const completedJobs = jobs.filter((j) => j.status === "completed");

    // 🔹 Completed contracts with populate
    const contracts = await Contract.find({
      clientId,
      status: "completed",
    })
      .populate("jobId", "title budget")
      .populate("freelancerId", "name")
      .sort({ createdAt: -1 });

    // 🔹 Total spent (future payment hook)
    const totalSpent = contracts.reduce(
      (sum, c) => sum + (c.jobId?.budget || 0),
      0
    );

    res.json({
      stats: {
        totalJobs: jobs.length,
        openJobs: openJobs.length,
        completedJobs: completedJobs.length,
        completedContracts: contracts.length,
        totalSpent,
      },

      jobs: {
        all: jobs,
        open: openJobs,
        completed: completedJobs,
      },

      contracts: contracts.map((c) => ({
        contractId: c._id,
        job: {
          id: c.jobId?._id,
          title: c.jobId?.title,
          budget: c.jobId?.budget,
        },
        freelancer: {
          id: c.freelancerId?._id,
          name: c.freelancerId?.name,
        },
        completedAt: c.updatedAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* CLIENT RATING */
export const clientRating = async (req, res) => {
  try {
    const { clientId } = req.params;

    const reviews = await Review.find({ toUser: clientId })
      .populate("fromUser", "name role")
      .sort({ createdAt: -1 });

    if (!reviews.length) {
      return res.json({
        averageRating: 0,
        totalReviews: 0,
        reviews: [],
      });
    }

    const avg =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    res.json({
      averageRating: Number(avg.toFixed(1)),
      totalReviews: reviews.length,
      reviews: reviews.map((r) => ({
        rating: r.rating,
        comment: r.comment,
        givenBy: {
          id: r.fromUser._id,
          name: r.fromUser.name,
          role: r.fromUser.role, // freelancer
        },
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/* CLIENT TRUST SCORE */
export const clientTrustScore = async (req, res) => {
  try {
    const { clientId } = req.params;

    // Reviews
    const reviews = await Review.find({ toUser: clientId });
    const avgRating = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    // Jobs
    const completedJobs = await Job.countDocuments({
      clientId,
      status: "completed",
    });

    // Contracts (for spend – placeholder)
    const contracts = await Contract.find({
      clientId,
      status: "completed",
    });

    const totalSpent = contracts.reduce(
      (sum, c) => sum + (c.amount || 0),
      0
    );

    // Account age
    const user = await User.findById(clientId);
    const accountAgeMonths =
      (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24 * 30);

    // ---- SCORE CALCULATION ----
    const ratingScore = (avgRating / 5) * 40;
    const jobScore = Math.min(completedJobs, 20) * 1.5; // max 30
    const spendScore = Math.min(totalSpent / 1000, 20); // max 20
    const ageScore = Math.min(accountAgeMonths, 10); // max 10

    const trustScore = Math.round(
      ratingScore + jobScore + spendScore + ageScore
    );

    res.json({
      trustScore,
      breakdown: {
        avgRating: Number(avgRating.toFixed(1)),
        completedJobs,
        totalSpent,
        accountAgeMonths: Math.floor(accountAgeMonths),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




/* BLOCK FREELANCER */
export const blockFreelancer = async (req, res) => {
  try {
    const { freelancerId } = req.params;

    let profile = await clientProfileModel.findOne({ userId: req.user.id });

    // create profile if not exists
    if (!profile) {
      profile = await clientProfileModel.create({ userId: req.user.id });
    }

    // already blocked check
    if (profile.blockedFreelancers.includes(freelancerId)) {
      return res.status(400).json({
        message: "Freelancer already blocked",
      });
    }

    profile.blockedFreelancers.push(freelancerId);

    // if favorite, remove from favorites
    profile.favoriteFreelancers = profile.favoriteFreelancers.filter(
      (id) => id.toString() !== freelancerId
    );

    await profile.save();

    res.json({
      message: "Freelancer blocked successfully",
      blockedFreelancers: profile.blockedFreelancers,
      favoriteFreelancers: profile.favoriteFreelancers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* UNBLOCK FREELANCER */
/* UNBLOCK FREELANCER */
export const unblockFreelancer = async (req, res) => {
  try {
    const { freelancerId } = req.params;

    const profile = await clientProfileModel.findOne({
      userId: req.user.id,
    });

    if (!profile) {
      return res.status(400).json({
        message: "No blocked freelancers found",
      });
    }

    // not blocked check
    if (!profile.blockedFreelancers.includes(freelancerId)) {
      return res.status(400).json({
        message: "Freelancer is not blocked",
      });
    }

    profile.blockedFreelancers = profile.blockedFreelancers.filter(
      (id) => id.toString() !== freelancerId
    );

    await profile.save();

    res.json({
      message: "Freelancer unblocked successfully",
      blockedFreelancers: profile.blockedFreelancers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* FAVORITE FREELANCER */
export const favoriteFreelancer = async (req, res) => {
  try {
    const { freelancerId } = req.params;

    let profile = await clientProfileModel.findOne({ userId: req.user.id });

    // create profile if not exists
    if (!profile) {
      profile = await clientProfileModel.create({ userId: req.user.id });
    }

    // blocked check
    if (profile.blockedFreelancers.includes(freelancerId)) {
      return res.status(400).json({
        message: "Blocked freelancer cannot be added to favorites",
      });
    }

    // already favorite check
    if (profile.favoriteFreelancers.includes(freelancerId)) {
      return res.status(400).json({
        message: "Freelancer already in favorites",
      });
    }

    profile.favoriteFreelancers.push(freelancerId);
    await profile.save();

    res.json({
      message: "Freelancer added to favorites",
      favoriteFreelancers: profile.favoriteFreelancers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/* REMOVE FAVORITE FREELANCER */
export const removeFavoriteFreelancer = async (req, res) => {
  try {
    const { freelancerId } = req.params;

    const profile = await clientProfileModel.findOne({
      userId: req.user.id,
    });

    if (!profile) {
      return res.status(400).json({
        message: "No favorite freelancers found",
      });
    }

    // not favorite check
    if (!profile.favoriteFreelancers.includes(freelancerId)) {
      return res.status(400).json({
        message: "Freelancer not in favorites",
      });
    }

    profile.favoriteFreelancers = profile.favoriteFreelancers.filter(
      (id) => id.toString() !== freelancerId
    );

    await profile.save();

    res.json({
      message: "Freelancer removed from favorites",
      favoriteFreelancers: profile.favoriteFreelancers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* GET BLOCKED & FAVORITE FREELANCERS */
export const getClientPreferences = async (req, res) => {
  try {
    const profile = await clientProfileModel.findOne({
      userId: req.user.id,
    })
      .populate("blockedFreelancers", "name email")
      .populate("favoriteFreelancers", "name email");

    res.json(profile || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET SAVED FREELANCERS (BOOKMARKS) */
export const getSavedFreelancers = async (req, res) => {
  try {
    const profile = await clientProfileModel.findOne({
      userId: req.user.id,
    }).populate("favoriteFreelancers", "name email role");

    if (!profile) {
      return res.status(404).json({ message: "Client profile not found" });
    }

    res.json({
      savedFreelancers: profile.favoriteFreelancers,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

