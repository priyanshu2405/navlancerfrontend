import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true },
    category: { type: String, required: true },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    isRemote: {
      type: Boolean,
      default: true,
    },

    country: {
      type: String,
    },

    language: {
      type: String,
      default: "English",
    },

    status: {
      type: String,
      enum: ["open", "hired", "completed", "expired"],
      default: "open",
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    invitedFreelancers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    reports: [
      {
        reportedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        reason: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    reportCount: {
      type: Number,
      default: 0,
    },

  },
  { timestamps: true }
);

export default mongoose.model("Job", jobSchema);
