import mongoose from "mongoose";

const proposalSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverLetter: { type: String },
    price: { type: Number },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isBookmarked: {
      type: Boolean,
      default: false,
    },

    clientNotes: {
      type: String,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    qualityScore: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["invited", "pending", "accepted", "rejected", "withdrawn", "expired"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Proposal", proposalSchema);
