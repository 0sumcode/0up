import { json, error } from '@sveltejs/kit';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, expiresIn } from '$lib/S3';
import { PRIVATE_S3_BUCKET } from '$env/static/private';
import { PUBLIC_UPLOAD_EXPIRE_OPTIONS, PUBLIC_UPLOAD_MAX_DOWNLOAD_OPTIONS } from '$env/static/public';
import { prisma } from '$lib';

const maxExpires = Math.max(...JSON.parse(PUBLIC_UPLOAD_EXPIRE_OPTIONS));
const maxDownloads = Math.max(...JSON.parse(PUBLIC_UPLOAD_MAX_DOWNLOAD_OPTIONS));

// Stores upload to the database and returns URL data
export const POST = async ({ params, request }) => {
  const req = await request.json();
  const files = req.files;
  const expire_hours = !req.expires || req.expires > maxExpires ? maxExpires : req.expires;
  const expire_downloads = !req.downloads || req.downloads > maxDownloads ? maxDownloads : req.downloads;
  if (!files.length) {
    throw error(400, 'Bad request');
  }

  // Create upload record
  const upload = await prisma.upload.create({
    data: {
      hash: files[0].data.hash,
      expire_hours,
      expire_downloads,
    },
  });

  for (const file of files) {
    const command = new HeadObjectCommand({
      Bucket: PRIVATE_S3_BUCKET,
      Key: file.path,
    });
    try {
      const response = await s3Client.send(command);

      if (!response || (typeof response.ContentLength !== 'number' && typeof response.ContentLength !== 'bigint')) {
        throw error(400, 'Bad request');
      }

      // Create a file record
      await prisma.file.create({
        data: {
          id: file.path.split('/')[1],
          upload: upload.id,
          salt: file.data.salt,
          header: file.data.header,
          size: response.ContentLength,
          meta_header: file.data.meta.header,
          meta_data: file.data.meta.data,
        },
      });
    } catch (e) {
      // Probably an invalid S3 object
      throw error(400, 'Bad request');
    }
  }

  return json({ upload: upload.id });
};
