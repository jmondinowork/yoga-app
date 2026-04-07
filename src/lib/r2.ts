import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ENDPOINT = process.env.R2_ENDPOINT!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET = process.env.R2_BUCKET!;

const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Génère une URL présignée temporaire pour accéder à un fichier sur R2.
 */
export async function getPresignedUrl(
  key: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });
  return getSignedUrl(r2Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Upload un fichier vers R2.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await r2Client.send(command);
}

/**
 * Récupère le contenu d'un fichier depuis R2.
 */
export async function getObjectFromR2(
  key: string
): Promise<{ body: Uint8Array; contentType: string }> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });
  const response = await r2Client.send(command);
  const body = await response.Body?.transformToByteArray();
  return {
    body: body || new Uint8Array(),
    contentType: response.ContentType || "application/octet-stream",
  };
}

/**
 * Supprime un fichier de R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });
  await r2Client.send(command);
}

/**
 * Supprime tous les fichiers sous un préfixe R2 (ex: "cours/mon-slug/").
 */
export async function deleteR2Folder(prefix: string): Promise<void> {
  const listCommand = new ListObjectsV2Command({
    Bucket: R2_BUCKET,
    Prefix: prefix,
  });
  const response = await r2Client.send(listCommand);

  if (response.Contents?.length) {
    await Promise.all(
      response.Contents
        .filter((obj) => obj.Key)
        .map((obj) => deleteFromR2(obj.Key!))
    );
  }
}
