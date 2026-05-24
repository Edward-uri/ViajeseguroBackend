import {
  getPresignedProfilePhotoUpload,
  type AllowedImageContentType,
  type PresignedUploadResult,
} from '../../infrastructure/s3.js';

export interface PresignProfilePhotoInput {
  idUsuario: number;
  contentType: AllowedImageContentType;
}

export class PresignProfilePhotoUpload_UseCase {
  async execute({ idUsuario, contentType }: PresignProfilePhotoInput): Promise<PresignedUploadResult> {
    return getPresignedProfilePhotoUpload(idUsuario, contentType);
  }
}
