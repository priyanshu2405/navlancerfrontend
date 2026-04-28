import mongoose from "mongoose";

const contractSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proposal",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "active",
        "completed",
        "paused",
        "cancelled_by_client",
        "cancelled_by_freelancer",
        "cancelled_mutual"
      ],
      default: "active",
    },
    cancelReason: {
      type: String,
    },

    cancelRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isMutualApproved: {
      type: Boolean,
      default: false,
    },

    deadline: {
      type: Date,
    },

    extensionRequested: {
      type: Boolean,
      default: false,
    },

    extensionNewDeadline: {
      type: Date,
    },

    extensionReason: {
      type: String,
    },

    activityLog: [
      {
        action: {
          type: String,
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        message: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    dispute: {
      isDisputed: {
        type: Boolean,
        default: false,
      },
      reason: String,
      raisedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      status: {
        type: String,
        enum: ["open", "resolved", "rejected"],
      },
    },

    milestones: [
      {
        title: {
          type: String,
          required: true,
        },
        description: String,
        status: {
          type: String,
          enum: ["pending", "in_progress", "completed"],
          default: "pending",
        },
        dueDate: Date,
        completedAt: Date,
      },
    ],

  },
  { timestamps: true }
);

export default mongoose.model("Contract", contractSchema);
