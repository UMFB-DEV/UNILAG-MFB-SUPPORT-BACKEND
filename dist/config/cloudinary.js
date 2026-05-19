"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const cloudinary_1 = require("cloudinary");
const env_1 = __importDefault(require("./env"));
const fs_1 = __importDefault(require("fs"));
cloudinary_1.v2.config({
    cloud_name: env_1.default.cloudinary.cloudName,
    api_key: env_1.default.cloudinary.apiKey,
    api_secret: env_1.default.cloudinary.apiSecret,
});
const uploadImage = async (file) => {
    try {
        const result = await cloudinary_1.v2.uploader.upload(file.path, {
            folder: 'ticket-images',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            max_file_size: 5 * 1024 * 1024, // 5MB
        });
        // Delete temp file after successful upload
        if (fs_1.default.existsSync(file.path)) {
            fs_1.default.unlinkSync(file.path);
        }
        return result.secure_url;
    }
    catch (error) {
        console.error('Cloudinary upload error:', error);
        // Clean up temp file on error
        if (fs_1.default.existsSync(file.path)) {
            fs_1.default.unlinkSync(file.path);
        }
        throw new Error('Failed to upload image to Cloudinary');
    }
};
exports.uploadImage = uploadImage;
exports.default = cloudinary_1.v2;
