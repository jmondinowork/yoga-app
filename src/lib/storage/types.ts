// ─── Storage Service Interface ─────────────────────────────────────
// Préparé pour AWS S3 + CloudFront. En V1, on utilise des URLs locales.

export interface StorageService {
  uploadVideo(file: File, key: string): Promise<string>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  deleteVideo(key: string): Promise<void>;
  uploadImage(file: File, key: string): Promise<string>;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
