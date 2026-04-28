import mongoose from "mongoose";

const clientProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },

    // Individual or Company
    isCompany: {
      type: Boolean,
      default: false,
    },

    companyName: {
      type: String,
    },

    profilePicture: {
      type: String,
      default: "",
    },

    description: {
      type: String,
    },

    website: {
      type: String,
    },

    industry: {
      type: String,
    },

    foundedYear: {
      type: Number,
    },

    employeeCount: {
      type: Number,
    },

    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: String,
    },

    socialLinks: {
      linkedin: String,
      twitter: String,
      facebook: String,
      instagram: String,
    },

    // future-ready fields
    totalSpent: {
      type: Number,
      default: 0,
    },

    totalJobsPosted: {
      type: Number,
      default: 0,
    },

    totalReviews: {
      type: Number,
      default: 0
    },

    averageRating: {
      type: Number,
      default: 0
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    blockedFreelancers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    favoriteFreelancers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("clientprofiles", clientProfileSchema);
