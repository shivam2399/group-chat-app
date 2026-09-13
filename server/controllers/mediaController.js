const {
    uploadToS3
} = require("../services/mediaService");

const uploadMedia = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        const result = await uploadToS3({
            file: req.file,
            userId: req.user.id
        });

        return res.status(201).json({
            success: true,
            message: "File uploaded successfully",
            data: {
                mediaKey: result.key,
                url: result.url,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype
            }
        });

    } catch (error) {

        console.error(
            "MEDIA UPLOAD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to upload file"
        });
    }
};

module.exports = {
    uploadMedia
};