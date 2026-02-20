import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY,
  },
});

export const uploadToCloudflare = async (file) => {
  const fileName = `${Date.now()}-${file.originalname}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return {
    url: `${process.env.CLOUDFLARE_PUBLIC_URL}/${fileName}`,
  };
};
