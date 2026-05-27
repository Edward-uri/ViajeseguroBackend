import { randomUUID } from 'node:crypto';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../core/env.js';

export type AllowedImageContentType = 'image/jpeg' | 'image/png' | 'image/webp';

export const ALLOWED_IMAGE_CONTENT_TYPES: ReadonlyArray<AllowedImageContentType> = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
const PRESIGNED_UPLOAD_TTL_SECONDS = 5 * 60;

const EXT_BY_CONTENT_TYPE: Record<AllowedImageContentType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const s3Client = new S3Client({ region: env.AWS_REGION });

export interface PresignedUploadResult {
  uploadUrl: string;
  s3Key: string;
  publicUrl: string;
  expiresIn: number;
  maxBytes: number;
}

export function buildProfilePhotoKey(idUsuario: number, contentType: AllowedImageContentType): string {
  const ext = EXT_BY_CONTENT_TYPE[contentType];
  return `users/${idUsuario}/profile/${randomUUID()}.${ext}`;
}

export function buildPublicUrl(s3Key: string): string {
  if (env.AWS_S3_PUBLIC_BASE_URL) {
    return `${env.AWS_S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${s3Key}`;
  }
  return `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${s3Key}`;
}

export async function getPresignedProfilePhotoUpload(
  idUsuario: number,
  contentType: AllowedImageContentType,
): Promise<PresignedUploadResult> {
  const s3Key = buildProfilePhotoKey(idUsuario, contentType);
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: s3Key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: PRESIGNED_UPLOAD_TTL_SECONDS,
  });

  return {
    uploadUrl,
    s3Key,
    publicUrl: buildPublicUrl(s3Key),
    expiresIn: PRESIGNED_UPLOAD_TTL_SECONDS,
    maxBytes: MAX_PROFILE_PHOTO_BYTES,
  };
}

export async function deleteObject(s3Key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: s3Key,
    }),
  );
}
