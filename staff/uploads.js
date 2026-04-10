import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Cloudinary config (make sure this exists in config/cloudinary.js)
import "../config/cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "rivo-products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 1000, crop: "limit" } // optional optimization
    ],
  },
});

// Multer using Cloudinary storage
const upload = multer({ storage });

export default upload;