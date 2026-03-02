import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand  } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY,
  },
});

// Add 'folder' as the second parameter here! 
export const uploadToCloudflare = async (file, folder = "general/") => {
  
  // 1. Ensure folder ends with /
  const folderPrefix = folder.endsWith('/') ? folder : `${folder}/`;
  
  // 2. Prepend the folderPrefix to the filename
  const fileName = `${folderPrefix}${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET,
      Key: fileName, // This 'Key' now includes the folder path
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );
  console.log(`Uploaded to: ${fileName}`); // Fixed syntax

  return fileName; // Returns "blogs/1771865617408-testvdo.MOV"
};

export const generateSignedUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.CLOUDFLARE_BUCKET,
    Key: key,
  });

  return await getSignedUrl(s3, command, {
    expiresIn: 60 * 60, // 1 hour
  });
};

export const deleteFromCloudflare = async (key) => {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET,
      Key: key,
    })
  );
};