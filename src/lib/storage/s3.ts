import type { StorageService } from "./types";

/**
 * Implémentation AWS S3 du service de stockage.
 * À implémenter en V2.
 *
 * Prérequis :
 * - npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 * - Variables d'environnement :
 *   - AWS_REGION
 *   - AWS_ACCESS_KEY_ID
 *   - AWS_SECRET_ACCESS_KEY
 *   - AWS_S3_BUCKET
 *   - AWS_CLOUDFRONT_DOMAIN (optionnel)
 */
export class S3StorageService implements StorageService {
  async uploadVideo(_file: File, _key: string): Promise<string> {
    throw new Error("S3StorageService not implemented yet. Coming in V2.");
  }

  async getSignedUrl(_key: string, _expiresIn?: number): Promise<string> {
    throw new Error("S3StorageService not implemented yet. Coming in V2.");
  }

  async deleteVideo(_key: string): Promise<void> {
    throw new Error("S3StorageService not implemented yet. Coming in V2.");
  }

  async uploadImage(_file: File, _key: string): Promise<string> {
    throw new Error("S3StorageService not implemented yet. Coming in V2.");
  }
}
