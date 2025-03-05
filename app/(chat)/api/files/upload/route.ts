import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getUser } from '@/lib/auth';
import * as Minio from 'minio';
import { getMessageFile, saveMessageFile } from '@/lib/services/minio';

let minioClient: Minio.Client | null = null;

const getMinioClient = () => {
  const S3_CUSTOM_ENDPOINT = process.env.S3_CUSTOM_ENDPOINT;
  const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
  const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;

  if (
    !S3_CUSTOM_ENDPOINT ||
    !S3_ACCESS_KEY_ID ||
    !S3_SECRET_ACCESS_KEY ||
    !process.env.S3_STORAGE_BUCKET_NAME
  ) {
    throw new Error('Missing S3 environment variables');
  }

  if (!minioClient) {
    minioClient = new Minio.Client({
      endPoint: S3_CUSTOM_ENDPOINT,
      useSSL: true,
      accessKey: S3_ACCESS_KEY_ID,
      secretKey: S3_SECRET_ACCESS_KEY,
    });
  }

  return minioClient;
};

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 20 * 1024 * 1024, {
      message: 'File size should be less than 20MB',
    })
    // Update the file type based on the kind of files you want to accept
    .refine((file) => ['image/jpeg', 'image/png'].includes(file.type), {
      message: 'File type should be JPEG or PNG',
    }),
});

export async function POST(request: Request) {
  const session = await getUser();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const chatId = (formData.get('chatId') as string | null) || undefined;
    const file = formData.get('file') as Blob;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    try {
      const file = formData.get('file') as File;
      const name = await saveMessageFile(file.name, Buffer.from(await file.arrayBuffer()), chatId);
      const url = await getMessageFile(name, chatId);

      return NextResponse.json({
        url,
        name,
        contentType: file.type,
      });
    } catch (error) {
      console.log(error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}
