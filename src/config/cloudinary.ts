import { v2 as cloudinary } from 'cloudinary';
import env from './env';
import fs from 'fs';
import path from 'path';

cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

export const uploadImage = async (file: Express.Multer.File): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'ticket-images',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      max_file_size: 5 * 1024 * 1024, // 5MB
    });

    // Delete temp file after successful upload
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Clean up temp file on error
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw new Error('Failed to upload image to Cloudinary');
  }
};

export default cloudinary;
