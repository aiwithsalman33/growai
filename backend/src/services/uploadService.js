const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');

// Local disk, backed by the `uploads_data` named Docker volume. There is no
// object storage in this stack — swap this module for an S3/GCS adapter if that
// ever changes; nothing else touches the filesystem.
const UPLOAD_ROOT = path.resolve(__dirname, '../../', env.uploadDir);

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

ensureDir(UPLOAD_ROOT);

/** Keeps the original extension, discards the caller-supplied name. */
function safeFilename(originalname) {
  const ext = path.extname(originalname || '').toLowerCase().slice(0, 10);
  return `${crypto.randomUUID()}${ext || '.jpg'}`;
}

/** `photos` | `posts` — a fixed set, never taken from user input. */
function bucketFor(req) {
  return req.uploadBucket || 'misc';
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    try {
      cb(null, ensureDir(path.join(UPLOAD_ROOT, bucketFor(req))));
    } catch (err) {
      cb(err);
    }
  },
  filename(req, file, cb) {
    cb(null, safeFilename(file.originalname));
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    const err = new Error(`Unsupported file type: ${file.mimetype}`);
    err.status = 415;
    return cb(err);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.maxUploadBytes, files: 1 },
});

/**
 * Tags the request with a destination bucket, then runs multer.
 * Usage: `router.post('/', uploadSingle('photos', 'file'), handler)`
 */
function uploadSingle(bucket, field = 'file') {
  const handler = upload.single(field);
  return (req, res, next) => {
    req.uploadBucket = bucket;
    handler(req, res, next);
  };
}

/**
 * Public URL for a stored file. Relative on purpose — nginx serves `/uploads/`
 * in production and the dev server calls the API host directly, so neither
 * needs an absolute origin baked into the database.
 */
function publicUrl(file) {
  if (!file) return null;
  const rel = path.relative(UPLOAD_ROOT, file.path).split(path.sep).join('/');
  return `/uploads/${rel}`;
}

/** Best-effort — a missing file should not fail the delete of its DB row. */
function removeByUrl(url) {
  if (!url || !url.startsWith('/uploads/')) return false;
  const relative = url.replace(/^\/uploads\//, '');
  const target = path.resolve(UPLOAD_ROOT, relative);
  // Guard against `../` traversal in a stored URL.
  if (!target.startsWith(UPLOAD_ROOT)) return false;
  try {
    fs.unlinkSync(target);
    return true;
  } catch {
    return false;
  }
}

module.exports = { upload, uploadSingle, publicUrl, removeByUrl, UPLOAD_ROOT };
