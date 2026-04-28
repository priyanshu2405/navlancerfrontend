import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, unique: true, required: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: ["client", "freelancer", "admin"],
            default: "client",
        },
        isBlocked: { type: Boolean, default: false },
        loginAttempts: {
            type: Number,
            default: 0,
        },
        lockUntil: {
            type: Date,
        },

    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);
