const { put, del } = require('@vercel/blob');
const path = require('path');
const fs = require('fs');

const localUploadsDir = path.join(__dirname, '..', 'uploads');

/**
 * Upload a file from multer memoryStorage.
 * - Production (BLOB_READ_WRITE_TOKEN set): sends to Vercel Blob, returns the public URL.
 * - Local dev (no token): saves to Backend/uploads/, returns '/uploads/filename'.
 *
 * @param {Express.Multer.File} file  - req.file or item from req.files
 * @param {string} [folder]           - sub-folder in Blob store (e.g. 'articles', 'boutiques')
 * @returns {Promise<string>} public URL
 */
async function uploadFile(file, folder = '') {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    const pathname = folder ? `${folder}/${filename}` : filename;

    const blob = await put(pathname, file.buffer, {
      access: 'public',
      contentType: file.mimetype
    });
    return blob.url;
  } else {
    if (!fs.existsSync(localUploadsDir)) {
      fs.mkdirSync(localUploadsDir, { recursive: true });
    }
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + path.extname(file.originalname);
    fs.writeFileSync(path.join(localUploadsDir, filename), file.buffer);
    return '/uploads/' + filename;
  }
}

/**
 * Delete a file from Vercel Blob (or local disk in dev).
 * Silently ignores missing files.
 *
 * @param {string} url - the URL previously returned by uploadFile()
 */
async function deleteFile(url) {
  if (!url) return;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    // Only try to delete Blob URLs (ignore legacy local paths)
    if (url.startsWith('http')) {
      try { await del(url); } catch (_) {}
    }
  } else {
    // Local: url = '/uploads/filename'
    if (url.startsWith('/uploads/')) {
      const filePath = path.join(localUploadsDir, url.replace('/uploads/', ''));
      try { fs.unlinkSync(filePath); } catch (_) {}
    }
  }
}

/**
 * Replace an existing file with a new upload.
 * Deletes the old file then uploads the new one.
 *
 * @param {string} oldUrl             - URL of the file to delete
 * @param {Express.Multer.File} file  - new file from multer
 * @param {string} [folder]           - sub-folder in Blob store
 * @returns {Promise<string>} new public URL
 */
async function updateFile(oldUrl, file, folder = '') {
  await deleteFile(oldUrl);
  return uploadFile(file, folder);
}

module.exports = { uploadFile, deleteFile, updateFile };
