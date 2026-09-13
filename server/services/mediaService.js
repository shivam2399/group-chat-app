const {
    PutObjectCommand
} = require("@aws-sdk/client-s3");

const s3 = require("../config/s3");

const uploadToS3 = async ({ file, userId }) => {

    const key =
        `users/${userId}/${Date.now()}-${file.originalname}`;

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
    });

    await s3.send(command);

    const url =
        `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return {
        key,
        url
    };
};

module.exports = {
    uploadToS3
};