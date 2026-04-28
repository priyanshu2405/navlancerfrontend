import multer from "multer";
import path from "path";

const allowedTypes = [
  "image/png",
  "image/jpeg",
  "application/pdf",
];

const storage = multer.diskStorage({
  destination: "uploads/jobs",
  filename: (req, file, cb) => {
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
        file.originalname
      )}`
    );
  },
});

export const jobUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only images or PDF allowed"), false);
    }
    cb(null, true);
  },
});
