const { uploadToS3 } = require("../services/mediaService");
const { generatePresignedUploadUrl } = require("../services/s3Service");

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "video/mp4",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
];

const getPresignedUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType, fileSize } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: "fileName and fileType are required",
      });
    }

    if (fileSize && Number(fileSize) > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: "File size exceeds the 25 MB limit",
      });
    }

    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported file type",
      });
    }

    const presignedData = await generatePresignedUploadUrl({
      fileName,
      fileType,
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: {
        uploadUrl: presignedData.uploadUrl,
        mediaKey: presignedData.mediaKey,
        fileName,
        fileSize,
        mimeType: fileType,
      },
    });
  } catch (error) {
    console.error("PRESIGNED UPLOAD URL ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate presigned upload URL",
    });
  }
};

const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const result = await uploadToS3({
      file: req.file,
      userId: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: {
        mediaKey: result.key,
        url: result.url,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error("MEDIA UPLOAD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to upload file",
    });
  }
};

module.exports = {
  getPresignedUploadUrl,
  uploadMedia,
};
