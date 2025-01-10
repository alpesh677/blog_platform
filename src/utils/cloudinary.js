import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImageOnCloudinary = async (imagePath) => {
    try {
        if(!imagePath) return null;

        console.log('uploading image on cloudinary');

        const cloudinaryResponse = await cloudinary.uploader.upload(imagePath, {
            resource_type: 'auto',
            folder: 'my-folder',
        });

        console.log('image uploaded successfully on cloudinary'); 

        fs.unlinkSync(imagePath);
        return cloudinaryResponse;
    } catch (error) {
        fs.unlinkSync(imagePath);
        console.log("CLOUDINARY: FILE UPLOAD ERROR", error);
        return null;
    }
}

const deleteImageFromCloudinary = async (url) => {
    try {
        if(!url) return;

        const publicId = url.split('/').pop().split('.')[0];

        console.log('deleting image from cloudinary');

        const cloudinaryResponse = await cloudinary.uploader.destroy(publicId);

        console.log('image deleted successfully from cloudinary');
    } catch (error) {
        console.log("CLOUDINARY: FILE DELETE ERROR", error);
    }
};

export default { uploadImageOnCloudinary, deleteImageFromCloudinary };