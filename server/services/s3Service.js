const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../config/s3");

const generatePresignedUrl = async (key) => {

    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key
    });

    const signedUrl = await getSignedUrl(
        s3,
        command,
        {
            expiresIn: 900
        }
    );

    return signedUrl;
};

module.exports = {
    generatePresignedUrl
};