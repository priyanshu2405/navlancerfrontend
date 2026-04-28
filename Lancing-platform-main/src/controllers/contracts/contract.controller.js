import Contract from "../../models/contract.model.js";
import Job from "../../models/job.model.js";
import { createAuditLog } from "../../utils/createAuditLog.js";

/* GET CONTRACT BY ID */
export const getContractById = async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findById(contractId)
      .populate("jobId")
      .populate("clientId", "name email")
      .populate("freelancerId", "name email")
      .populate("proposalId");

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Check if user is authorized to view this contract
    const userId = req.user.id;
    if (
      contract.clientId._id.toString() !== userId &&
      contract.freelancerId._id.toString() !== userId
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json({ contract });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* CLIENT → COMPLETE CONTRACT */
export const completeContract = async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (contract.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    contract.status = "completed";

    // Activity Log
    contract.activityLog.push({
      action: "completed",
      performedBy: req.user.id,
      message: "Contract marked as completed",
    });

    await contract.save();

    // mark job completed
    await Job.findByIdAndUpdate(contract.jobId, {
      status: "completed",
    });


    // ✅ AUDIT LOG ADDED
    await createAuditLog(
      req.user.id,
      "contract_completed",
      "contract",
      contract._id,
      "Client completed contract"
    );

    res.json({ message: "Contract completed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* REQUEST CONTRACT CANCELLATION */
export const requestCancelContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { reason } = req.body;

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (contract.status !== "active") {
      return res.status(400).json({
        message: "Only active contracts can be cancelled",
      });
    }

    if (
      contract.clientId.toString() !== req.user.id &&
      contract.freelancerId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    contract.cancelRequestedBy = req.user.id;
    contract.cancelReason = reason;

    // Activity Log
    contract.activityLog.push({
      action: "cancel_requested",
      performedBy: req.user.id,
      message: reason,
    });

    await contract.save();

    res.json({ message: "Cancellation request sent" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* APPROVE CANCELLATION */
export const approveCancelContract = async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (!contract.cancelRequestedBy) {
      return res.status(400).json({
        message: "No cancellation request found",
      });
    }

    if (
      contract.clientId.toString() !== req.user.id &&
      contract.freelancerId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    contract.status = "cancelled_mutual";
    contract.isMutualApproved = true;

    // Activity Log
    contract.activityLog.push({
      action: "cancelled_mutual",
      performedBy: req.user.id,
      message: "Contract cancelled mutually",
    });

    await contract.save();

    res.json({ message: "Contract cancelled mutually" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* PAUSE CONTRACT */
export const pauseContract = async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (contract.status !== "active") {
      return res.status(400).json({
        message: "Only active contracts can be paused",
      });
    }

    contract.status = "paused";

    //  Activity Log
    contract.activityLog.push({
      action: "paused",
      performedBy: req.user.id,
      message: "Contract paused",
    });

    await contract.save();

    res.json({ message: "Contract paused successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* RESUME CONTRACT */
export const resumeContract = async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (contract.status !== "paused") {
      return res.status(400).json({
        message: "Only paused contracts can be resumed",
      });
    }

    contract.status = "active";

    // Activity Log
    contract.activityLog.push({
      action: "resumed",
      performedBy: req.user.id,
      message: "Contract resumed",
    });

    await contract.save();

    res.json({ message: "Contract resumed successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* REQUEST EXTENSION */
export const requestExtension = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { newDeadline, reason } = req.body;

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (contract.status !== "active") {
      return res.status(400).json({
        message: "Only active contracts can request extension",
      });
    }

    // Only freelancer can request extension
    if (contract.freelancerId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Only freelancer can request extension",
      });
    }

    contract.extensionRequested = true;
    contract.extensionNewDeadline = newDeadline;
    contract.extensionReason = reason;

    //  Activity Log
    contract.activityLog.push({
      action: "extension_requested",
      performedBy: req.user.id,
      message: reason,
    });

    await contract.save();

    res.json({ message: "Extension request sent" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* APPROVE EXTENSION  Client*/
export const approveExtension = async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (!contract.extensionRequested) {
      return res.status(400).json({
        message: "No extension request found",
      });
    }

    // Only client approves
    if (contract.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Only client can approve extension",
      });
    }

    contract.deadline = contract.extensionNewDeadline;
    contract.extensionRequested = false;
    contract.extensionNewDeadline = null;
    contract.extensionReason = null;

    // Activity Log
    contract.activityLog.push({
      action: "extension_approved",
      performedBy: req.user.id,
      message: "Deadline extended",
    });

    await contract.save();

    res.json({ message: "Extension approved successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* REJECT EXTENSION */
export const rejectExtension = async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (!contract.extensionRequested) {
      return res.status(400).json({
        message: "No extension request found",
      });
    }

    if (contract.clientId.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Only client can reject extension",
      });
    }

    contract.extensionRequested = false;
    contract.extensionNewDeadline = null;
    contract.extensionReason = null;

    await contract.save();

    res.json({ message: "Extension rejected" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET CONTRACT ACTIVITY */
export const getContractActivity = async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findById(contractId)
      .populate("activityLog.performedBy", "name role");

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (
      contract.clientId.toString() !== req.user.id &&
      contract.freelancerId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(contract.activityLog);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* RAISE DISPUTE */
export const raiseDispute = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { reason } = req.body;

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (contract.status !== "active") {
      return res.status(400).json({
        message: "Only active contracts can be disputed",
      });
    }

    if (
      contract.clientId.toString() !== req.user.id &&
      contract.freelancerId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (contract.dispute?.isDisputed) {
      return res.status(400).json({
        message: "Dispute already raised",
      });
    }

    contract.dispute = {
      isDisputed: true,
      reason,
      raisedBy: req.user.id,
      status: "open",
    };

    contract.activityLog.push({
      action: "dispute_raised",
      performedBy: req.user.id,
      message: reason,
    });

    await contract.save();

    res.json({ message: "Dispute raised successfully" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* RESOLVE DISPUTE */
export const resolveDispute = async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (!contract.dispute?.isDisputed) {
      return res.status(400).json({
        message: "No active dispute found",
      });
    }

    contract.dispute.status = "resolved";
    contract.dispute.isDisputed = false;

    contract.activityLog.push({
      action: "dispute_resolved",
      performedBy: req.user.id,
      message: "Dispute resolved",
    });

    await contract.save();

    res.json({ message: "Dispute resolved successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET ALL CONTRACTS FOR AUTHENTICATED USER */
export const getMyContracts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query; // optional status filter

    const query = {
      $or: [{ clientId: userId }, { freelancerId: userId }]
    };

    if (status) {
      query.status = status;
    }

    const contracts = await Contract.find(query)
      .populate("jobId")
      .populate("clientId", "name email")
      .populate("freelancerId", "name email")
      .sort("-createdAt");

    res.json(contracts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ==================== MILESTONE/PROGRESS TRACKING ==================== */

/* FREELANCER → ADD MILESTONE TO CONTRACT */
export const addMilestone = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { title, description, dueDate } = req.body;

    const contract = await Contract.findById(contractId);
    if (!contract) return res.status(404).json({ message: "Contract not found" });

    if (contract.status !== "active") {
      return res.status(400).json({ message: "Cannot add milestones to inactive contracts" });
    }

    if (contract.freelancerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the freelancer can add milestones" });
    }

    contract.milestones.push({ title, description, dueDate, status: "pending" });

    // Activity Log
    contract.activityLog.push({
      action: "milestone_added",
      performedBy: req.user.id,
      message: `Task added: ${title}`,
    });

    await contract.save();
    res.status(201).json({ message: "Milestone added successfully", milestones: contract.milestones });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* FREELANCER → UPDATE MILESTONE STATUS */
export const updateMilestoneStatus = async (req, res) => {
  try {
    const { contractId, milestoneId } = req.params;
    const { status } = req.body;

    const contract = await Contract.findById(contractId);
    if (!contract) return res.status(404).json({ message: "Contract not found" });

    if (contract.freelancerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the freelancer can update milestones" });
    }

    const milestone = contract.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });

    milestone.status = status;
    if (status === "completed") {
      milestone.completedAt = new Date();
    }

    // Activity Log
    contract.activityLog.push({
      action: "milestone_updated",
      performedBy: req.user.id,
      message: `Task '${milestone.title}' marked as ${status}`,
    });

    await contract.save();
    res.json({ message: "Milestone updated", milestones: contract.milestones });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* FREELANCER → DELETE MILESTONE (MISTAKE FIX) */
export const deleteMilestone = async (req, res) => {
  try {
    const { contractId, milestoneId } = req.params;

    const contract = await Contract.findById(contractId);
    if (!contract) return res.status(404).json({ message: "Contract not found" });

    if (contract.freelancerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the freelancer can delete milestones" });
    }

    const milestone = contract.milestones.id(milestoneId);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });

    contract.milestones.pull(milestoneId);

    // Activity Log
    contract.activityLog.push({
      action: "milestone_deleted",
      performedBy: req.user.id,
      message: `Task '${milestone.title}' was deleted`,
    });

    await contract.save();
    res.json({ message: "Milestone deleted", milestones: contract.milestones });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

