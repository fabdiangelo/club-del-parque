import { storage as defaultStorage } from "../FirebaseServices.js";
import path from "path";
import { randomUUID } from "crypto";

function isEmulator() {
  return Boolean(
    process.env.STORAGE_EMULATOR_HOST ||
    process.env.FIREBASE_EMULATOR_HUB ||
    process.env.FUNCTIONS_EMULATOR ||
    process.env.GCLOUD_PROJECT === "demo-project"
  );
}

function buildPublicUrl({ bucket, objectPath, token }) {
  if (isEmulator()) {
    const raw = process.env.STORAGE_EMULATOR_HOST || "127.0.0.1:9199";
    const host = raw.startsWith("http") ? raw : `http://${raw}`;
    return `${host}/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
  }
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
}

function sanitizeFileName(name = "uploaded") {
  return name.replace(/[^a-z0-9._-]+/gi, "_");
}

export default class StorageConnection {
  constructor({ storage = defaultStorage, bucketName } = {}) {
    if (!storage) throw new Error("StorageConnection: `storage` is required");
    const name =
      bucketName ||
      process.env.GCLOUD_STORAGE_BUCKET ||
      storage.app?.options?.storageBucket ||
      "demo-bucket";
    this.bucket = storage.bucket(name);
  }

  async uploadBuffer(buffer, destinationPath, contentType = "application/octet-stream") {
    const file = this.bucket.file(destinationPath);
    const token = randomUUID();

    console.log("[storage] bucket:", this.bucket.name, "emu:", !!process.env.STORAGE_EMULATOR_HOST, "dest:", destinationPath, "ctype:", contentType);
    console.time(`[file.save] ${destinationPath}`);

    await file.save(buffer, {
      metadata: {
        contentType,
        cacheControl: "public, max-age=31536000",
        metadata: { firebaseStorageDownloadTokens: token },
      },
      resumable: false,
      public: false,
      validation: false,
    });

    console.timeEnd(`[file.save] ${destinationPath}`);

    const publicUrl = buildPublicUrl({
      bucket: this.bucket.name,
      objectPath: destinationPath,
      token,
    });

    return { publicUrl, storagePath: destinationPath };
  }

  async delete(storagePath) {
    if (!storagePath) return;
    try { await this.bucket.file(storagePath).delete({ ignoreNotFound: true }); } catch {}
  }

  buildDestination(baseDir, id, fileName) {
    const ts = Date.now();
    const clean = sanitizeFileName(fileName || "image");
    return path.posix.join(baseDir, id, `${ts}-${clean}`);
  }
}
