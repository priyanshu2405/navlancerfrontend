import multer from "multer";
import path from "path";

// allowed file types
const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
];

const storage = multer.diskStorage({
    destination: "uploads/profile-pictures",
    filename: (req, file, cb) => {
        cb(
            null,
            `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
                file.originalname
            )}`
        );
    },
});

export const profilePicUpload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(
                new Error("Only JPG or PNG images are allowed"),
                false
            );
        }
        cb(null, true);
    },
});
