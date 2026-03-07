const multer = require('multer');
const path = require('path');

// memoryStorage: file kept in RAM as req.file.buffer
// blob.js handles the actual upload to Vercel Blob (prod) or disk (local)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = upload;
