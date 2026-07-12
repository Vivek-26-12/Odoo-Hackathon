import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

// Setup multer memory storage
const storage = multer.memoryStorage();

// File filter (accept images only)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only image uploads are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware to upload to Cloudinary
export const uploadImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    // Convert buffer to base64 data URI string
    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: 'assetflow/assets',
      resource_type: 'image'
    });

    // Attach URL to request body so controller can save it
    req.body.photo_url = result.secure_url;
    next();
  } catch (error) {
    console.error('❌ Cloudinary Upload Error:', error.message);
    return res.status(500).json({ success: false, message: 'Image upload failed. Please try again.' });
  }
};

export default upload;
