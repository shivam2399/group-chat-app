const { GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");
const path = require("path");
const s3 = require("../config/s3");

const generatePresignedUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3, command, {
    expiresIn: 900,
  });

  return signedUrl;
};

const generatePresignedUploadUrl = async ({ fileName, fileType, userId }) => {
  const rawExt = path.extname(fileName || "");
  const sanitizedExt = rawExt.replace(/[^a-zA-Z0-9.]/g, "").toLowerCase();
  const uniqueId = crypto.randomUUID
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString("hex");
  const key = `uploads/${userId}/${Date.now()}-${uniqueId}${sanitizedExt}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3, command, {
    expiresIn: 300,
  });

  return {
    uploadUrl,
    mediaKey: key,
  };
};

module.exports = {
  generatePresignedUrl,
  generatePresignedUploadUrl,
};
