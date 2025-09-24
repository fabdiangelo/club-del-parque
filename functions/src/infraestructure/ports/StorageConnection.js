import { storage as defaultStorage } from '../FirebaseServices.js';
import path from 'path';

function resolveBucketName(storage, bucketName) {
  return (
    bucketName ||
    process.env.GCLOUD_STORAGE_BUCKET ||
    (storage.app?.options?.storageBucket) ||
    'demo-bucket'
  );
}

export default class StorageConnection {
  constructor({ storage = defaultStorage, bucketName } = {}) {
    if (!storage) throw new Error('StorageConnection: `storage` is required');
    const name = resolveBucketName(storage, bucketName);
    this.bucket = storage.bucket(name);
  }

  async uploadBuffer(buffer, destinationPath, contentType, makePublic = true) {
    const file = this.bucket.file(destinationPath);
    await file.save(buffer, {
      metadata: { contentType, cacheControl: 'public, max-age=31536000' },
      resumable: false,
    });
    if (makePublic) {
      await file.makePublic();
    }
    const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${encodeURI(destinationPath)}`;
    return { publicUrl, storagePath: destinationPath };
  }

  async delete(storagePath) {
    if (!storagePath) return;
    await this.bucket.file(storagePath).delete({ ignoreNotFound: true });
  }

  buildDestination(baseDir, id, fileName) {
    const ts = Date.now();
    const clean = (fileName || 'image').replace(/\s+/g, '-');
    return path.posix.join(baseDir, id, `${ts}-${clean}`);
  }
}