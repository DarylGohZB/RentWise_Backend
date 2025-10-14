const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp + random + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `listing-${uniqueSuffix}${ext}`);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, GIF, WEBP) are allowed!'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files per request
  },
  fileFilter: fileFilter
});

// Middleware for single file upload
const uploadSingle = upload.single('image');

// Middleware for multiple file upload
const uploadMultiple = upload.array('images', 5);

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB per image.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum 5 images per listing.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected field name. Use "images" for multiple files or "image" for single file.'
      });
    }
  }
  
  if (err.message.includes('Only image files')) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  
  next(err);
};

// Helper function to get file URLs
const getFileUrl = (filename) => {
  if (!filename) return null;
  return `/uploads/${filename}`;
};

// Helper function to get multiple file URLs
const getFileUrls = (files) => {
  if (!files || files.length === 0) return [];
  return files.map(file => getFileUrl(file.filename));
};

// Helper function to delete files
const deleteFile = (filename) => {
  if (!filename) return;
  const filePath = path.join(uploadsDir, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Helper function to delete multiple files
const deleteFiles = (filenames) => {
  if (!filenames || filenames.length === 0) return;
  filenames.forEach(filename => deleteFile(filename));
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  getFileUrl,
  getFileUrls,
  deleteFile,
  deleteFiles,
  uploadsDir
};
