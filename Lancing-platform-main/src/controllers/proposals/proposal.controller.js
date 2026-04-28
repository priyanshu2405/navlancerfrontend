import Proposal from "../../models/proposal.model.js";
import Job from "../../models/job.model.js";
import Contract from "../../models/contract.model.js";
import { createAuditLog } from "../../utils/createAuditLog.js";

/* FREELANCER → SEND PROPOSAL */
export const sendProposal = async (req, res) => {
  try {
    const { jobId, coverLetter, price } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    //  PRIVATE JOB CHECK
    if (
      job.visibility === "private" &&
      !job.invitedFreelancers.includes(req.user.id)
    ) {
      return res.status(403).json({
        message: "You are not invited to this private job",
      });
    }
    //  PREVENT PROPOSAL ON EXPIRED / CLOSED JOB
    if (job.status !== "open") {
      return res.status(400).json({
        message: `Cannot apply to a ${job.status} job`,
      });
    }

    // PREVENT DUPLICATE PROPOSAL
    const exists = await Proposal.findOne({
      jobId,
      freelancerId: req.user.id,
    });

    if (exists) {
      return res.status(400).json({
        message: "Proposal already sent for this job",
      });
    }

    // SPAM PREVENTION — DAILY LIMIT
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayCount = await Proposal.countDocuments({
      freelancerId: req.user.id,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    const DAILY_LIMIT = 10;
    if (todayCount >= DAILY_LIMIT) {
      return res.status(429).json({
        message: "Daily proposal limit reached",
      });
    }

    // Create proposal
    const proposal = await Proposal.create({
      jobId,
      freelancerId: req.user.id,
      coverLetter,
      price,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });


    //  SIMPLE QUALITY SCORING
    let score = 0;

    if (coverLetter.length > 100) score += 10;
    if (price > 0) score += 5;

    proposal.qualityScore = score;

    await proposal.save();

    await createAuditLog(
      req.user.id,
      "proposal_sent",
      "proposal",
      proposal._id,
      "Freelancer sent proposal"
    );

    res.status(201).json({
      message: "Proposal sent successfully",
      proposal,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* CLIENT → VIEW PROPOSALS FOR A JOB */
export const getProposalsByJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    // ensure only job owner can see proposals
    if (job.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    //  FETCH PROPOSALS WITH PAGINATION
    const proposals = await Proposal.find({ jobId })
      .populate("freelancerId", "name email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalProposals = await Proposal.countDocuments({ jobId });

    res.json({
      proposals,
      currentPage: page,
      totalPages: Math.ceil(totalProposals / limit),
      totalProposals,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* CLIENT → HIRE FREELANCER */
export const hireFreelancer = async (req, res) => {
  try {
    const { proposalId } = req.params;

    const proposal = await Proposal.findById(proposalId).populate("jobId");
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    const job = proposal.jobId;

    if (job.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // accept selected proposal
    proposal.status = "accepted";
    await proposal.save();

    if (job.status === "open") {
      job.status = "hired";
      await job.save();
    }

    // CREATE CONTRACT
    const contract = await Contract.create({
      jobId: job._id,
      clientId: job.clientId,
      freelancerId: proposal.freelancerId,
      proposalId: proposal._id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      activityLog: [
        {
          action: "contract_created",
          performedBy: req.user.id,
          message: "Contract created after hiring",
        },
      ],
    });



    res.json({
      message: "Freelancer hired & contract created",
      contract,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




/* CLIENT → REJECT PROPOSAL */
export const rejectProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;

    const proposal = await Proposal.findById(proposalId).populate("jobId");
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    const job = proposal.jobId;

    // only job owner can reject
    if (job.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (proposal.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Proposal already processed" });
    }

    proposal.status = "rejected";
    await proposal.save();

    res.json({ message: "Proposal rejected successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/* FREELANCER → WITHDRAW PROPOSAL */
export const withdrawProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;

    // Find proposal
    const proposal = await Proposal.findById(proposalId).populate("jobId");
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    // Ownership check (only same freelancer)
    if (proposal.freelancerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Only pending proposals allowed
    if (proposal.status !== "pending") {
      return res.status(400).json({
        message: "Only pending proposals can be withdrawn",
      });
    }

    // If job already hired, block
    if (proposal.jobId.status === "hired") {
      return res.status(400).json({
        message: "Cannot withdraw proposal after hiring",
      });
    }

    // Withdraw proposal
    proposal.status = "withdrawn";
    await proposal.save();

    res.json({
      message: "Proposal withdrawn successfully",
      proposal,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/* FREELANCER → ADD PROPOSAL ATTACHMENT */
export const addProposalAttachment = async (req, res) => {
  try {
    const { proposalId } = req.params;

    const proposal = await Proposal.findById(proposalId);
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    // Ownership check
    if (proposal.freelancerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Only pending proposals
    if (proposal.status !== "pending") {
      return res.status(400).json({
        message: "Attachments allowed only for pending proposals",
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File required" });
    }

    proposal.attachments.push({
      fileName: req.file.originalname,
      fileUrl: `/uploads/proposals/${req.file.filename}`,
    });

    await proposal.save();

    res.json({
      message: "Attachment added successfully",
      attachments: proposal.attachments,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/* FREELANCER → EDIT PROPOSAL */
export const editProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { coverLetter, price } = req.body;

    const proposal = await Proposal.findById(proposalId).populate("jobId");
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    // Ownership check
    if (proposal.freelancerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Status check
    if (proposal.status !== "pending") {
      return res.status(400).json({
        message: "Only pending proposals can be edited",
      });
    }

    // Job state check
    if (proposal.jobId.status === "hired") {
      return res.status(400).json({
        message: "Cannot edit proposal after hiring",
      });
    }

    // Apply updates (only allowed fields)
    if (coverLetter !== undefined) {
      proposal.coverLetter = coverLetter;
    }

    if (price !== undefined) {
      proposal.price = price;
    }

    await proposal.save();

    res.json({
      message: "Proposal updated successfully",
      proposal,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* FREELANCER → VIEW OWN PROPOSALS */
export const getMyProposals = async (req, res) => {
  try {
    const proposals = await Proposal.find({
      freelancerId: req.user.id,
    }).populate("jobId", "title status");

    res.json(proposals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* BOOKMARK PROPOSAL */
export const bookmarkProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;

    const proposal = await Proposal.findById(proposalId).populate("jobId");
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    if (proposal.jobId.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    proposal.isBookmarked = !proposal.isBookmarked;
    await proposal.save();

    res.json({
      message: "Proposal bookmark updated",
      isBookmarked: proposal.isBookmarked,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/* ADD CLIENT NOTES */
export const addClientNote = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { note } = req.body;

    const proposal = await Proposal.findById(proposalId).populate("jobId");
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    if (proposal.jobId.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    proposal.clientNotes = note;
    await proposal.save();

    res.json({ message: "Client note saved" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};




/* ARCHIVE PROPOSAL */
export const archiveProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;

    const proposal = await Proposal.findById(proposalId).populate("jobId");
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    if (proposal.jobId.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    proposal.isArchived = true;
    await proposal.save();

    res.json({ message: "Proposal archived successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/* SEARCH PROPOSALS */
export const searchProposals = async (req, res) => {
  try {
    const { keyword } = req.query;

    const proposals = await Proposal.find({
      coverLetter: { $regex: keyword, $options: "i" },
      isArchived: false,
    }).populate("freelancerId", "name");

    res.json(proposals);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ACCEPT INVITE */
export const acceptInvite = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { coverLetter, price } = req.body;

    const proposal = await Proposal.findById(proposalId).populate("jobId");
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    // Ownership check 
    if (proposal.freelancerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // State check
    if (proposal.status !== "invited") {
      return res.status(400).json({
        message: "Only 'invited' proposals can be accepted",
      });
    }

    // Validate Input
    if (!coverLetter || !price) {
      return res.status(400).json({ message: "Cover letter and price are required to accept the invite." });
    }

    // Apply updates
    proposal.coverLetter = coverLetter;
    proposal.price = price;
    proposal.status = "pending";

    // Simple Quality Scoring
    let score = 0;
    if (coverLetter.length > 100) score += 10;
    if (price > 0) score += 5;
    proposal.qualityScore = score;

    await proposal.save();

    res.json({
      message: "Invitation accepted. Proposal sent.",
      proposal,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* DECLINE INVITE */
export const declineInvite = async (req, res) => {
  try {
    const { proposalId } = req.params;

    const proposal = await Proposal.findById(proposalId).populate("jobId");
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    // Ownership check 
    if (proposal.freelancerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // State check
    if (proposal.status !== "invited") {
      return res.status(400).json({
        message: "Only 'invited' proposals can be declined",
      });
    }

    // Withdraw proposal / Reject the invitation
    proposal.status = "rejected";
    await proposal.save();

    res.json({
      message: "Invitation declined successfully.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
