import { LocalStorageService } from "./local";
import type { StorageService } from "./types";

export type { StorageService, UploadProgress } from "./types";

// En V1, on utilise le stockage local
// En V2, changer pour S3StorageService
export const storage: StorageService = new LocalStorageService();
