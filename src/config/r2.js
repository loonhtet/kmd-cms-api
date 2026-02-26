import { S3Client } from "@aws-sdk/client-s3";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_KEY,
  },
});

const R2_BUCKET_NAME = process.env.CLOUDFLARE_BUCKET;

export { r2Client, R2_BUCKET_NAME };

