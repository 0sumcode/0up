import { json, error } from '@sveltejs/kit';
import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, expiresIn } from '$lib/S3';
import { PRIVATE_S3_BUCKET } from '$env/static/private';

// Stores upload to the database and returns URL data
export const POST = async ({ params, request }) => {
  const files = await request.json();
  if (!files.length) {
    throw error(400, 'Bad request');
  }

  // Create upload record
  // TODO

  for (const file of files) {
    const command = new HeadObjectCommand({
      Bucket: PRIVATE_S3_BUCKET,
      Key: file.path,
    });
    try {
      const response = await s3Client.send(command);

      // Create a file record
      // TODO
    } catch (e) {
      // Probably an invalid S3 object
      throw error(400, 'Bad request');
    }
  }

  return json({});
};
