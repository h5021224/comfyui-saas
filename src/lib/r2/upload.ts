import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

type UploadImageParams = {
  bytes: ArrayBuffer;
  key: string;
  contentType: string;
};

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
};

let client: S3Client | null = null;

export async function uploadImageToR2({ bytes, key, contentType }: UploadImageParams) {
  const config = getR2Config();
  const r2Client = getR2Client(config);

  await r2Client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: Buffer.from(bytes),
      ContentType: contentType,
    }),
  );

  return `${config.publicUrl.replace(/\/$/, '')}/${key}`;
}

function getR2Client(config: R2Config) {
  client ??= new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return client;
}

function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
    throw new Error('Cloudflare R2 is not configured');
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicUrl,
  };
}
