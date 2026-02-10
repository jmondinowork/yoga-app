import type { StorageService } from "./types";

/**
 * Implémentation locale du service de stockage.
 * En V1, les vidéos sont servies depuis /public/videos/
 * et les images depuis /public/images/
 */
export class LocalStorageService implements StorageService {
  async uploadVideo(_file: File, key: string): Promise<string> {
    // En V1, retourner simplement le chemin local
    return `/videos/${key}`;
  }

  async getSignedUrl(key: string, _expiresIn?: number): Promise<string> {
    // En local, pas besoin de signature
    return `/videos/${key}`;
  }

  async deleteVideo(_key: string): Promise<void> {
    // Pas d'action en local
    console.warn("LocalStorageService: deleteVideo is a no-op in V1");
  }

  async uploadImage(_file: File, key: string): Promise<string> {
    return `/images/${key}`;
  }
}

export const storageService = new LocalStorageService();
