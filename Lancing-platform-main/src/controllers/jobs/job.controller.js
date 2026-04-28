import jobModel from "../../models/job.model.js";
import { createAuditLog } from "../../utils/createAuditLog.js";

/* CLIENT → CREATE JOB */
export const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      budget,
      category,
      tags = [],
      expiryDate,
      isRemote = true,
      country,
      language = "English",
      visibility = "public",
      invitedFreelancers = [],
    } = req.body;

    const attachments = [];

    if (req.file) {
      attachments.push({
        fileName: req.file.originalname,
        fileUrl: `/uploads/jobs/${req.file.filename}`,
      });
    }

    const job = await jobModel.create({
      title,
      description,
      budget,
      category,
      tags,
      expiryDate,
      isRemote,
      country,
      language,
      attachments,
      visibility,
      invitedFreelancers,
      clientId: req.user.id,
    });

    // ASYNC BACKGROUND NOTIFICATION LOGIC
    if (visibility === "public") {
      (async () => {
        try {
          const { default: User } = await import("../../models/user.model.js");
          const { default: Notification } = await import("../../models/notification.model.js");

          const activeFreelancers = await User.find({
            role: "freelancer",
            isBlocked: false,
          }).select("_id");

          const notifications = activeFreelancers.map((freelancer) => ({
            userId: freelancer._id,
            type: "new_job_posted",
            message: `A new job "${job.title}" matching the ${job.category} category has been posted!`,
            relatedId: job._id,
          }));

          if (notifications.length > 0) {
            await Notification.insertMany(notifications);
          }
        } catch (bgErr) {
          console.error("Delayed Job Notification Error:", bgErr);
        }
      })();
    }

    res.status(201).json({ message: "Job created successfully", job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* FREELANCER → GET ALL OPEN JOBS */
export const getJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      status: "open",
      isDeleted: false,
      $or: [
        { visibility: "public" },
        {
          visibility: "private",
          invitedFreelancers: req.user.id,
        },
      ],
    };

    const jobs = await jobModel
      .find(query)
      .populate("clientId", "name")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalJobs = await jobModel.countDocuments(query);

    res.json({
      jobs,
      currentPage: page,
      totalPages: Math.ceil(totalJobs / limit),
      totalJobs,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* GET SINGLE JOB */
export const getJobById = async (req, res) => {
  try {
    const job = await jobModel.findById(req.params.id)
      .populate("clientId", "name email");

    if (!job || job.isDeleted) {
      return res.status(404).json({ message: "Job not found" });
    }

    //  PRIVATE JOB SECURITY
    if (
      job.visibility === "private" &&
      job.clientId._id.toString() !== req.user.id &&
      !job.invitedFreelancers.includes(req.user.id)
    ) {
      return res.status(403).json({
        message: "You are not allowed to view this job",
      });
    }

    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// UPDATE JOB
export const updateJob = async (req, res) => {
  try {
    const job = await jobModel.findById(req.params.id);

    if (!job || job.isDeleted) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (job.status !== "open") {
      return res.status(400).json({
        message: "Cannot edit hired/completed job",
      });
    }

    //  PRIVATE JOB VALIDATION
    if (
      req.body.visibility === "private" &&
      (!req.body.invitedFreelancers ||
        req.body.invitedFreelancers.length === 0)
    ) {
      return res.status(400).json({
        message: "Private job must have invited freelancers",
      });
    }

    const updatedJob = await jobModel.findByIdAndUpdate(
      job._id,
      req.body,
      { new: true }
    );

    res.json({ message: "Job updated", job: updatedJob });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// SOFT DELETE JOB
export const deleteJob = async (req, res) => {
  try {
    const job = await jobModel.findById(req.params.id);

    if (!job || job.isDeleted) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (job.status !== "open") {
      return res.status(400).json({
        message: "Cannot delete hired/completed job",
      });
    }

    job.isDeleted = true;
    await job.save();


    await createAuditLog(
      req.user.id,
      "job_deleted",
      "job",
      job._id,
      "Client soft deleted job"
    );

    res.json({ message: "Job deleted (soft)" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const reopenJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await jobModel.findOne({
      _id: jobId,
      clientId: req.user.id,
      // Removed isDeleted: false to allow finding deleted jobs
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.status !== "expired" && !job.isDeleted) {
      return res
        .status(400)
        .json({ message: "Only expired or deleted jobs can be reopened" });
    }

    job.status = "open";
    job.isDeleted = false;
    // Set expiry to provided date or default to 30 days from now
    const { expiryDate } = req.body || {};
    job.expiryDate = expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await job.save();

    res.json({
      message: "Job reopened successfully",
      job,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const duplicateJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await jobModel.findOne({
      _id: jobId,
      clientId: req.user.id,
      // Allowed duplicating even if isDeleted: true
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const newJob = await jobModel.create({
      title: job.title,
      description: job.description,
      budget: job.budget,
      category: job.category,
      tags: job.tags,
      isRemote: job.isRemote,
      country: job.country,
      language: job.language,
      visibility: job.visibility,
      invitedFreelancers: job.invitedFreelancers,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      clientId: job.clientId,
      status: "open",
    });

    res.status(201).json({
      message: "Job duplicated successfully",
      job: newJob,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/* SEARCH JOBS (CATEGORY + TAGS) */
export const searchJobs = async (req, res) => {
  try {
    const { category, tag, country, language, remote, minBudget, maxBudget } = req.query;

    const filter = {
      status: "open",
      isDeleted: false,
      $or: [
        { visibility: "public" },
        {
          visibility: "private",
          invitedFreelancers: req.user.id,
        },
      ],
    };

    if (category) filter.category = category;
    if (tag) filter.tags = { $in: [tag.toLowerCase()] };
    if (language) filter.language = language;
    if (remote !== undefined) filter.isRemote = remote === "true";
    if (country) filter.country = country;

    if (minBudget !== undefined || maxBudget !== undefined) {
      filter.budget = {};
      if (minBudget !== undefined) filter.budget.$gte = Number(minBudget);
      if (maxBudget !== undefined) filter.budget.$lte = Number(maxBudget);
    }

    const jobs = await jobModel
      .find(filter)
      .populate("clientId", "name");

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/* REPORT JOB */
export const reportJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { reason } = req.body;

    const job = await jobModel.findById(jobId);
    if (!job || job.isDeleted) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Prevent client from reporting own job
    if (job.clientId.toString() === req.user.id) {
      return res.status(400).json({
        message: "You cannot report your own job",
      });
    }

    // Prevent duplicate report
    const alreadyReported = job.reports.find(
      (r) => r.reportedBy.toString() === req.user.id
    );

    if (alreadyReported) {
      return res.status(400).json({
        message: "You already reported this job",
      });
    }

    job.reports.push({
      reportedBy: req.user.id,
      reason,
    });

    job.reportCount += 1;

    await job.save();

    res.json({ message: "Job reported successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* INVITE FREELANCER TO JOB */
export const inviteFreelancer = async (req, res) => {
  try {
    const { jobId, freelancerId } = req.params;

    const job = await jobModel.findById(jobId);

    if (!job || job.isDeleted) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Ensure only the job owner can send invites
    if (job.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden. Only the client can invite freelancers." });
    }

    // Ensure the job is still open
    if (job.status !== "open") {
      return res.status(400).json({ message: "Cannot invite to closed jobs." });
    }

    if (job.invitedFreelancers.includes(freelancerId)) {
      return res.status(400).json({ message: "Freelancer is already invited." });
    }

    // Prevent duplicate invitations by checking proposals
    const { default: Proposal } = await import("../../models/proposal.model.js");
    const existingInvite = await Proposal.findOne({
      jobId,
      freelancerId,
    });

    if (existingInvite) {
      return res.status(400).json({ message: "Freelancer has already been invited or applied." });
    }

    // Generate a dummy dummy proposal simulating the 'invite'
    const inviteProposal = await Proposal.create({
      jobId,
      freelancerId,
      status: "invited",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    job.invitedFreelancers.push(freelancerId);
    await job.save();

    res.json({ message: "Freelancer invited successfully", inviteProposal });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
