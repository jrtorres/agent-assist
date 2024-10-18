const express = require("express");
const router = express.Router();
const IBM = require("ibm-cos-sdk");
require("dotenv").config();

var config = {
  endpoint: process.env.COS_ENDPOINT,
  apiKeyId: process.env.COS_API_KEY_ID,
  serviceInstanceId: process.env.COS_SERVICE_INSTANCE_ID,
  signatureVersion: process.env.COS_SIGNATURE_VERSION,
};

var cos = new IBM.S3(config);

router.get("/", async (req, res) => {
  const bucketName = process.env.BUCKET_NAME;

  try {
    // List all objects in the bucket
    const listObjectsResponse = await cos
      .listObjects({ Bucket: bucketName })
      .promise();

    // Array to store content of each object
    const objectsContent = [];

    // Iterate over each object and fetch its content
    for (const object of listObjectsResponse.Contents) {
      const objectKey = object.Key;

      // Get the content of each object
      const getObjectResponse = await cos
        .getObject({ Bucket: bucketName, Key: objectKey })
        .promise();

      //console.log("File COntent", getObjectResponse.Body)

      // Extract relevant information for each object
      const objectInfo = {
        Key: objectKey,
        Size: getObjectResponse.ContentLength,
        ContentType: getObjectResponse.ContentType,
        LastModified: getObjectResponse.LastModified,
        //Body: getObjectResponse.Body
        // Add any other relevant information you want to include
      };

      objectsContent.push(objectInfo);

      console.log(objectInfo);
    }

    // Send the content of all objects as the response
    res.status(200).json({ bucketName, objectsContent });
  } catch (error) {
    console.error(`ERROR: ${error.code} - ${error.message}`);
    res
      .status(500)
      .json({ error: `Error retrieving objects content: ${error.message}` });
  }
});

module.exports = router;
