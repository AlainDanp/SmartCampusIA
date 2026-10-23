// Stockage des photos : S3 si S3_BUCKET est défini, sinon disque local (dev / plan B).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BUCKET = process.env.S3_BUCKET;
const LOCAL_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

let s3;
let S3Cmd;
if (BUCKET) {
  S3Cmd = require('@aws-sdk/client-s3');
  // Identifiants : rôle IAM de l'EC2 (aucune clé dans le code)
  s3 = new S3Cmd.S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
}

async function savePhoto(file) {
  const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
  const key = `photos/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${ext}`;

  if (s3) {
    await s3.send(new S3Cmd.PutObjectCommand({
      Bucket: BUCKET, Key: key, Body: file.buffer, ContentType: file.mimetype,
    }));
  } else {
    const target = path.join(LOCAL_DIR, key);
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.writeFile(target, file.buffer);
  }
  return key;
}

// Renvoie un flux lisible ; l'API le relaie après contrôle d'accès (bucket jamais public).
async function readPhoto(key) {
  const contentType = key.endsWith('.png') ? 'image/png' : 'image/jpeg';
  if (s3) {
    const out = await s3.send(new S3Cmd.GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return { stream: out.Body, contentType: out.ContentType || contentType };
  }
  return { stream: fs.createReadStream(path.join(LOCAL_DIR, key)), contentType };
}

module.exports = { savePhoto, readPhoto, mode: BUCKET ? `s3://${BUCKET}` : `local:${LOCAL_DIR}` };
