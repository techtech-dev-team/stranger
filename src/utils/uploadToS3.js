const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,     // ✅ required
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // ✅ required
  region: process.env.AWS_REGION                  // ✅ optional but good
});

const uploadToS3 = (file) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME, // ✅ THIS MUST BE DEFINED
    Key: `uploads/${Date.now()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  return s3.upload(params).promise();
};

module.exports = uploadToS3;
