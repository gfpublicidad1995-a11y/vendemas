import { env } from "@/lib/config/env";

// Storage abstracto. Mock/local por defecto; preparado para S3 / R2 / Supabase.

export interface UploadInput {
  key: string;
  contentType?: string;
  data?: Uint8Array | string;
}

export interface StorageService {
  uploadFile(input: UploadInput): Promise<{ key: string; url: string }>;
  getFileUrl(key: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
  createSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
}

class MockStorageService implements StorageService {
  async uploadFile(input: UploadInput) {
    return { key: input.key, url: this.placeholder(input.key) };
  }
  async getFileUrl(key: string) {
    return this.placeholder(key);
  }
  async deleteFile(_key: string) {
    // no-op en mock
  }
  async createSignedUrl(key: string) {
    return `${this.placeholder(key)}?signed=mock`;
  }
  private placeholder(key: string) {
    return `https://placehold.co/600x600/166534/FFFFFF?text=${encodeURIComponent(key.slice(0, 20))}`;
  }
}

function createStorageService(): StorageService {
  // env.STORAGE_PROVIDER ∈ local | s3 | r2 | supabase
  // Cuando se implementen, devolver el proveedor correspondiente acá.
  if (env.STORAGE_PROVIDER !== "local") {
    console.warn(
      `[VendeMás] STORAGE_PROVIDER=${env.STORAGE_PROVIDER} aún no implementado. Usando mock local.`
    );
  }
  return new MockStorageService();
}

export const storageService: StorageService = createStorageService();
