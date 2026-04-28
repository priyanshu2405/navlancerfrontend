import mongoose from "mongoose";

const freelancerProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            unique: true,
            required: true,
        },
        // Intro Section
        linkedinUrl: {
            type: String,
            default: "",
        },
        resumeUrl: {
            type: String,
            default: "",
        },
        // Category Selection
        category: {
            type: String,
            default: "",
        },
        specialties: [{
            type: String,
        }],
        // Professional Details
        title: {
            type: String,
            default: "",
        },
        portfolio: [
            {
                title: String,
                fileUrl: String,
                uploadedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        profilePicture: {
            type: String,
            default: "",
        },
        skills: [{ type: String }],
        bio: { type: String },
        hourlyRate: { type: Number },
        // Experience Details
        experiences: [{
            company: String,
            position: String,
            startDate: Date,
            endDate: Date,
            current: {
                type: Boolean,
                default: false,
            },
            description: String,
        }],
        // Education Details
        education: [{
            institution: String,
            degree: String,
            fieldOfStudy: String,
            startDate: Date,
            endDate: Date,
            current: {
                type: Boolean,
                default: false,
            },
            description: String,
        }],
        // Language Details
        languages: [{
            language: String,
            proficiency: {
                type: String,
                enum: ["beginner", "intermediate", "advanced", "native"],
                default: "beginner",
            },
        }],
        // Location Details
        dob: {
            type: Date,
        },
        address: {
            street: String,
            city: String,
            state: String,
            zip: String,
            country: String,
        },
        phone: {
            type: String,
            default: "",
        },
        totalReviews: { type: Number, default: 0 },
        averageRating: { type: Number, default: 0 },
        availabilityStatus: {
            type: String,
            enum: ["available", "busy", "unavailable"],
            default: "available",
        },
        experienceLevel: {
            type: String,
            enum: ["beginner", "intermediate", "expert"],
            default: "beginner",
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verifiedAt: {
            type: Date,
        },
        savedJobs: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Job",
            },
        ],

    },
    { timestamps: true }
);

export default mongoose.model(
    "FreelancerProfile",
    freelancerProfileSchema
);
