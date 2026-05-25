const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_SIZE = 2 * 1024 * 1024;

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "ferreexpress/productos",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de archivo no permitido. Solo jpeg, png, webp, gif."), false);
  }
};

const upload = multer({ storage, limits: { fileSize: MAX_SIZE }, fileFilter });

module.exports = upload;
