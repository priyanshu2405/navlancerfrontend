import User from "../../models/user.model.js";
import Job from "../../models/job.model.js";
import Contract from "../../models/contract.model.js";
import Proposal from "../../models/proposal.model.js";
import { createAuditLog } from "../../utils/createAuditLog.js";
import AuditLog from "../../models/auditLog.model.js";
import UserReport from "../../models/userReport.model.js";
import SupportTicket from "../../models/supportTicket.model.js";
import Skill from "../../models/skill.model.js";
import Category from "../../models/category.model.js";
import bcrypt from "bcrypt";

/* GET PLATFORM STATISTICS */
export const getPlatformStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });
        const totalClients = await User.countDocuments({ role: "client" });
        const totalFreelancers = await User.countDocuments({ role: "freelancer" });

        const totalJobs = await Job.countDocuments();
        const activeJobs = await Job.countDocuments({ status: "open", isDeleted: false });

        const totalContracts = await Contract.countDocuments();
        const activeContracts = await Contract.countDocuments({ status: "active" });

        res.json({
            success: true,
            data: {
                users: { total: totalUsers, clients: totalClients, freelancers: totalFreelancers },
                jobs: { total: totalJobs, active: activeJobs },
                contracts: { total: totalContracts, active: activeContracts },
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* GET ALL USERS (WITH PAGINATION) */
export const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { role: { $ne: "admin" } };

        if (req.query.role) query.role = req.query.role;
        if (req.query.search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: "i" } },
                { email: { $regex: req.query.search, $options: "i" } }
            ];
        }

        const users = await User.find(query)
            .select("-password")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalUsers = await User.countDocuments(query);

        res.json({
            success: true,
            data: users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalUsers / limit),
                totalRecords: totalUsers,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* TOGGLE USER BLOCK STATUS */
export const toggleUserBlockStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.role === "admin") {
            return res.status(403).json({ success: false, message: "Cannot block admin users" });
        }

        user.isBlocked = !user.isBlocked;

        // If blocked, optionally log out everywhere by resetting tokens (handled in auth flows generally)
        await user.save();

        await createAuditLog(
            req.user.id,
            user.isBlocked ? "user_blocked" : "user_unblocked",
            "user",
            user._id,
            `Admin ${user.isBlocked ? "blocked" : "unblocked"} user ${user.email}`
        );

        res.json({
            success: true,
            message: `User successfully ${user.isBlocked ? "blocked" : "unblocked"}`,
            user: { id: user._id, email: user.email, isBlocked: user.isBlocked },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* FORCE DELETE JOB (ADMIN MODERATION) */
export const moderateJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: "Job not found" });
        }

        job.isDeleted = true; // Soft delete for safety
        job.status = "expired";
        await job.save();

        await createAuditLog(
            req.user.id,
            "admin_job_deleted",
            "job",
            job._id,
            "Admin deleted a job for moderation"
        );

        res.json({ success: true, message: "Job successfully removed by admin" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* GET ALL DISPUTED CONTRACTS */
export const getDisputedContracts = async (req, res) => {
    try {
        const contracts = await Contract.find({ "dispute.isDisputed": true })
            .populate("clientId", "name email")
            .populate("freelancerId", "name email")
            .populate("jobId", "title");

        res.json({ success: true, data: contracts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* VERIFY USER (KYC) */
export const verifyUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.role === "admin") {
            return res.status(400).json({ success: false, message: "Cannot verify admin accounts" });
        }

        let updatedProfile;
        if (user.role === "freelancer") {
            const FreelancerProfile = (await import("../../models/freelancerProfile.model.js")).default;
            updatedProfile = await FreelancerProfile.findOneAndUpdate(
                { userId },
                { isVerified: true, verifiedAt: Date.now() },
                { new: true }
            );
        } else if (user.role === "client") {
            const ClientProfile = (await import("../../models/clientProfile.model.js")).default;
            updatedProfile = await ClientProfile.findOneAndUpdate(
                { userId },
                { isVerified: true },
                { new: true }
            );
        }

        if (!updatedProfile) {
            return res.status(404).json({ success: false, message: "User profile not found" });
        }

        await createAuditLog(
            req.user.id,
            "admin_verified_user",
            "user",
            user._id,
            `Admin verified ${user.role} profile for ${user.email}`
        );

        res.json({
            success: true,
            message: "User successfully verified",
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                isVerified: true
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* RESOLVE DISPUTE */
export const resolveDispute = async (req, res) => {
    try {
        const { contractId } = req.params;
        const { resolution, adminNotes } = req.body; // resolution should be 'resolved' or 'rejected'

        if (!["resolved", "rejected"].includes(resolution)) {
            return res.status(400).json({ success: false, message: "Invalid resolution status. Must be 'resolved' or 'rejected'." });
        }

        const contract = await Contract.findById(contractId);

        if (!contract) {
            return res.status(404).json({ success: false, message: "Contract not found" });
        }

        if (!contract.dispute.isDisputed || !contract.dispute.status || contract.dispute.status !== "open") {
            return res.status(400).json({ success: false, message: "Contract does not have an open dispute" });
        }

        contract.dispute.status = resolution;

        // Optionally update contract global status if resolved implies completion
        if (resolution === "resolved") {
            // Admin decided how to resolve it, perhaps the contract is now completed or cancelled
            contract.status = "completed";
        }

        contract.activityLog.push({
            action: `dispute_${resolution}`,
            performedBy: req.user.id,
            message: adminNotes || `Admin marked dispute as ${resolution}`,
        });

        await contract.save();

        await createAuditLog(
            req.user.id,
            "admin_resolved_dispute",
            "contract",
            contract._id,
            `Admin ${resolution} dispute on contract ${contract._id}`
        );

        res.json({
            success: true,
            message: `Dispute successfully ${resolution}`,
            contract
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* BROADCAST SYSTEM NOTIFICATION */
export const broadcastNotification = async (req, res) => {
    try {
        const { message, targetRole } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }

        const query = { role: { $ne: "admin" } };
        if (targetRole && ["client", "freelancer"].includes(targetRole)) {
            query.role = targetRole;
        }

        const targetUsers = await User.find(query).select("_id");

        if (targetUsers.length === 0) {
            return res.status(404).json({ success: false, message: "No target users found" });
        }

        const Notification = (await import("../../models/notification.model.js")).default;

        const notifications = targetUsers.map(user => ({
            userId: user._id,
            type: "system_alert",
            message: message,
            isRead: false
        }));

        await Notification.insertMany(notifications);

        await createAuditLog(
            req.user.id,
            "admin_system_broadcast",
            "notification",
            null,
            `Admin sent broadcast message to ${targetUsers.length} users (${targetRole || 'all'})`
        );

        res.json({
            success: true,
            message: `Broadcast message sent to ${targetUsers.length} users successfully`
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* GET ALL REVIEWS (ADMIN) */
export const getAllReviewsAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const Review = (await import("../../models/review.model.js")).default;

        const query = {};
        if (req.query.isReported) {
            query.isReported = req.query.isReported === 'true';
        }
        if (req.query.isDeleted) {
            query.isDeleted = req.query.isDeleted === 'true';
        }

        const reviews = await Review.find(query)
            .populate("fromUser", "name email role")
            .populate("toUser", "name email role")
            .populate("contractId")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalReviews = await Review.countDocuments(query);

        res.json({
            success: true,
            data: reviews,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalReviews / limit),
                totalRecords: totalReviews,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* MODERATE (DELETE/RESTORE) REVIEW */
export const moderateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { action } = req.body; // 'delete' or 'restore'

        if (!["delete", "restore"].includes(action)) {
            return res.status(400).json({ success: false, message: "Invalid action. Use 'delete' or 'restore'." });
        }

        const Review = (await import("../../models/review.model.js")).default;
        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        review.isDeleted = action === "delete";
        await review.save();

        await createAuditLog(
            req.user.id,
            `admin_${action}_review`,
            "review",
            review._id,
            `Admin ${action}d review ${review._id}`
        );

        res.json({
            success: true,
            message: `Review successfully ${action}d`,
            review
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* --- ADVANCED JOB MODERATION --- */

export const getAllJobsAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.isDeleted) query.isDeleted = req.query.isDeleted === "true";

        const jobs = await Job.find(query)
            .populate("clientId", "name email")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalJobs = await Job.countDocuments(query);

        res.json({
            success: true,
            data: jobs,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalJobs / limit),
                totalRecords: totalJobs,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateJobStatusAdmin = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { status, isDeleted } = req.body;

        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ success: false, message: "Job not found" });

        if (status) job.status = status;
        if (isDeleted !== undefined) job.isDeleted = isDeleted;

        await job.save();

        await createAuditLog(
            req.user.id,
            "admin_update_job",
            "job",
            job._id,
            `Admin updated job status to ${status} / deleted: ${isDeleted}`
        );

        res.json({ success: true, message: "Job updated successfully", data: job });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* --- ADVANCED PROPOSAL MODERATION (Spam Control) --- */

export const getAllProposalsAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const proposals = await Proposal.find()
            .populate("freelancerId", "name email")
            .populate("jobId", "title")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalProposals = await Proposal.countDocuments();

        res.json({
            success: true,
            data: proposals,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalProposals / limit),
                totalRecords: totalProposals,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteProposalAdmin = async (req, res) => {
    try {
        const { proposalId } = req.params;

        const proposal = await Proposal.findByIdAndDelete(proposalId);
        if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found" });

        await createAuditLog(
            req.user.id,
            "admin_delete_proposal",
            "proposal",
            proposal._id,
            `Admin deleted proposal due to moderation/spam control`
        );

        res.json({ success: true, message: "Proposal deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* --- ADMIN PROFILE COMMANDS --- */

// GET /admin/profile
export const getAdminProfile = async (req, res) => {
    try {
        const adminId = req.user.id;
        const adminUser = await User.findById(adminId).select("-password -__v");

        if (!adminUser || adminUser.role !== "admin") {
            return res.status(404).json({ success: false, message: "Admin profile not found" });
        }

        res.json({
            success: true,
            data: adminUser,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PATCH /admin/profile
export const updateAdminProfile = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { name, email, oldPassword, newPassword } = req.body;

        const adminUser = await User.findById(adminId);

        if (!adminUser || adminUser.role !== "admin") {
            return res.status(404).json({ success: false, message: "Admin profile not found" });
        }

        let isUpdated = false;

        // Update name
        if (name && name !== adminUser.name) {
            adminUser.name = name;
            isUpdated = true;
        }

        // Update email (checking if already taken)
        if (email && email !== adminUser.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Email is already in use by another account" });
            }
            adminUser.email = email;
            isUpdated = true;
        }

        // Update password (requires old password to verify)
        if (newPassword) {
            if (!oldPassword) {
                return res.status(400).json({ success: false, message: "Old password is required to set a new password" });
            }

            const isMatch = await bcrypt.compare(oldPassword, adminUser.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: "Incorrect old password" });
            }

            try {
                // Ensure correct import/generation for your hash
                const salt = await bcrypt.genSalt(10);
                adminUser.password = await bcrypt.hash(newPassword, salt);
                isUpdated = true;
            } catch (hashError) {
                return res.status(500).json({ success: false, message: "Error updating password" });
            }
        }

        if (isUpdated) {
            await adminUser.save();
            await createAuditLog(
                adminId,
                "admin_profile_updated",
                "user",
                adminId,
                "Admin updated their own profile settings."
            );
        }

        const updatedAdmin = adminUser.toObject();
        delete updatedAdmin.password; // Don't send the new hashed password

        res.json({
            success: true,
            message: "Admin profile updated successfully",
            data: updatedAdmin,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* --- AUDIT LOGS --- */

export const getAllAuditLogs = async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .populate("userId", "name email")
            .sort({ createdAt: -1 });

        res.json(logs);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

/* --- USER REPORTS --- */

export const reportUser = async (req, res) => {
    try {
        const { userId: reportedUserId } = req.params;
        const { reason, description } = req.body;
        const reporterId = req.user.id;

        if (reporterId === reportedUserId) {
            return res.status(400).json({ success: false, message: "You cannot report yourself" });
        }

        const reportedUser = await User.findById(reportedUserId);
        if (!reportedUser) {
            return res.status(404).json({ success: false, message: "Reported user not found" });
        }

        if (!reason || !description) {
            return res.status(400).json({ success: false, message: "Reason and description are required" });
        }

        // Check if user has already reported this person recently (prevent spam)
        const recentReport = await UserReport.findOne({
            reporterId,
            reportedUserId,
            status: "open"
        });

        if (recentReport) {
            return res.status(400).json({ success: false, message: "You already have an open report against this user." });
        }

        const report = await UserReport.create({
            reporterId,
            reportedUserId,
            reason,
            description
        });

        res.status(201).json({ success: true, message: "User reported successfully", data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllUserReports = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.reason) query.reason = req.query.reason;

        const reports = await UserReport.find(query)
            .populate("reporterId", "name email role")
            .populate("reportedUserId", "name email role isBlocked")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalReports = await UserReport.countDocuments(query);

        res.json({
            success: true,
            data: reports,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalReports / limit),
                totalRecords: totalReports,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateReportStatus = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { status, adminNotes } = req.body;

        if (!["investigated", "closed"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status. Use 'investigated' or 'closed'." });
        }

        const report = await UserReport.findById(reportId);
        if (!report) return res.status(404).json({ success: false, message: "Report not found" });

        report.status = status;
        if (adminNotes) report.adminNotes = adminNotes;

        await report.save();

        await createAuditLog(
            req.user.id,
            `admin_${status}_user_report`,
            "userReport",
            report._id,
            `Admin marked user report ${report._id} against user ${report.reportedUserId} as ${status}`
        );

        res.json({ success: true, message: `Report successfully marked as ${status}`, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* --- SUPPORT TICKETS --- */

export const createTicket = async (req, res) => {
    try {
        const { subject, message, priority } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ success: false, message: "Subject and message are required" });
        }

        const ticket = await SupportTicket.create({
            userId: req.user.id,
            subject,
            message,
            priority: priority || "medium"
        });

        res.status(201).json({ success: true, message: "Support ticket created successfully", data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json({ success: true, data: tickets });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllTickets = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};
        if (req.query.status) query.status = req.query.status;
        if (req.query.priority) query.priority = req.query.priority;

        const tickets = await SupportTicket.find(query)
            .populate("userId", "name email role")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalTickets = await SupportTicket.countDocuments(query);

        res.json({
            success: true,
            data: tickets,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalTickets / limit),
                totalRecords: totalTickets,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const replyToTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { adminReply, status } = req.body;

        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

        if (adminReply) ticket.adminReply = adminReply;
        if (status) {
            ticket.status = status;
            if (status === "resolved" || status === "closed") {
                ticket.resolvedAt = Date.now();
            }
        }

        await ticket.save();

        await createAuditLog(
            req.user.id,
            "admin_ticket_reply",
            "supportTicket",
            ticket._id,
            `Admin replied to ticket ${ticket._id} and set status to ${ticket.status}`
        );

        res.json({ success: true, message: "Ticket updated successfully", data: ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* --- TAXONOMY (SKILLS & CATEGORIES) --- */

export const createSkill = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, message: "Skill name is required" });

        const skill = await Skill.create({ name });
        res.status(201).json({ success: true, data: skill });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ success: false, message: "Skill already exists" });
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllSkills = async (req, res) => {
    try {
        const query = req.user && req.user.role === "admin" ? {} : { isDeleted: false };
        const skills = await Skill.find(query).sort({ name: 1 });
        res.json({ success: true, data: skills });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteSkill = async (req, res) => {
    try {
        const { id } = req.params;
        const skill = await Skill.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        if (!skill) return res.status(404).json({ success: false, message: "Skill not found" });
        res.json({ success: true, message: "Skill deleted successfully", data: skill });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ success: false, message: "Category name is required" });

        const category = await Category.create({ name });
        res.status(201).json({ success: true, data: category });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ success: false, message: "Category already exists" });
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllCategories = async (req, res) => {
    try {
        const query = req.user && req.user.role === "admin" ? {} : { isDeleted: false };
        const categories = await Category.find(query).sort({ name: 1 });
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
        if (!category) return res.status(404).json({ success: false, message: "Category not found" });
        res.json({ success: true, message: "Category deleted successfully", data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
