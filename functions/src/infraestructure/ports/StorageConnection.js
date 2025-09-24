// StorageConnection.js
import { storage as defaultStorage } from "../FirebaseServices.js";
import path from "path";
import { randomUUID } from "crypto";

function resolveBucketName(storage, bucketName) {
  return (
    bucketName ||
    process.env.GCLOUD_STORAGE_BUCKET ||
    storage.app?.options?.storageBucket ||
    "demo-bucket"
  );
}

function isEmulator() {
  // Any of these indicates local emulation / places where ACLs won’t work
  return !!(
    process.env.FUNCTIONS_EMULATOR ||
    process.env.FIREBASE_EMULATOR_HUB ||
    process.env.STORAGE_EMULATOR_HOST ||
    process.env.GCLOUD_PROJECT === "demo-project"
  );
}

export default class StorageConnection {
  constructor({ storage = defaultStorage, bucketName } = {}) {
    if (!storage) throw new Error("StorageConnection: `storage` is required");
    const name = resolveBucketName(storage, bucketName);
    this.bucket = storage.bucket(name);
  }

  /**
   * Uploads a buffer and returns a public URL that works in emulator and prod.
   * We avoid ACLs and instead use Firebase download tokens.
   */
  async uploadBuffer(buffer, destinationPath, contentType = "application/octet-stream", _makePublic = false) {
    const file = this.bucket.file(destinationPath);
    const token = randomUUID();

    await file.save(buffer, {
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000",
        // This is what makes the `v0` URL accessible without auth:
        metadata: { firebaseStorageDownloadTokens: token },
      },
      resumable: false,
      // Using ACLs (`public: true` / makePublic) won’t work on emulator/UBLA
      public: false,
      validation: false,
    });

    // Always return Firebase download-token URL (works on emulator and prod)
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${this.bucket.name}/o/${encodeURIComponent(
      destinationPath
    )}?alt=media&token=${token}`;

    return { publicUrl, storagePath: destinationPath };
  }

  async delete(storagePath) {
    if (!storagePath) return;
    try {
      await this.bucket.file(storagePath).delete({ ignoreNotFound: true });
    } catch {
      // best-effort
    }
  }

  buildDestination(baseDir, id, fileName) {
    const ts = Date.now();
    const clean = (fileName || "image").replace(/\s+/g, "-");
    return path.posix.join(baseDir, id, `${ts}-${clean}`);
  }
}
