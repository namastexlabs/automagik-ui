import 'server-only';
import * as Minio from 'minio';
import { generateUUID } from '../utils';

type ImageSource = 'document' | 'input';

let minioClient: Minio.Client | null = null;
const S3_STORAGE_BUCKET_NAME = process.env.S3_STORAGE_BUCKET_NAME as string;

const getMinioClient = () => {
  const S3_CUSTOM_ENDPOINT = process.env.S3_CUSTOM_ENDPOINT;
  const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
  const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;

  if (
    !S3_CUSTOM_ENDPOINT ||
    !S3_ACCESS_KEY_ID ||
    !S3_SECRET_ACCESS_KEY ||
    !S3_STORAGE_BUCKET_NAME
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

const DEFAULT_CHAT_KEY = 'no-chat';

export function getMessageKey(name: string, chatId?: string) {
  return `messages/${chatId ? `chat-${chatId}` : DEFAULT_CHAT_KEY}/${name.replace(
    /[^a-zA-Z0-9._-]/g,
    '',
  )}`;
}

export function createMessageKey(
  name: string,
  source: ImageSource = 'input',
  chatId?: string,
) {
  return getMessageKey(
    `${source}-${name}`,
    chatId,
  );
}

export function isKeyWithChatId(key: string) {
  return !key.includes(DEFAULT_CHAT_KEY);
}

export async function saveMessageFile(
  filename: string,
  buffer: Buffer,
  chatId?: string,
  source: ImageSource = 'input',
) {
  const name = `${generateUUID()}-${filename}`;
  const key = createMessageKey(name, source, chatId);

  try {
    await getMinioClient().putObject(
      S3_STORAGE_BUCKET_NAME,
      key,
      buffer,
      buffer.length,
    );

    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    return key.split('/').pop()!;
  } catch (e) {
    console.log(`Failed to save file ${e}`);
    throw e;
  }
}

export async function deleteMessageFile(name: string, chatId?: string) {
  try {
    await getMinioClient().removeObject(
      S3_STORAGE_BUCKET_NAME,
      getMessageKey(name, chatId),
    );
  } catch (e) {
    console.log(`Failed to delete file ${e}`);
    throw e;
  }
}

export async function copyMessageFile(
  sourceName: string,
  destinationName: string,
  sourceChatId?: string,
  destinationChatId?: string,
) {
  try {
    await getMinioClient().copyObject(
      S3_STORAGE_BUCKET_NAME,
      getMessageKey(destinationName, destinationChatId),
      `${S3_STORAGE_BUCKET_NAME}/${getMessageKey(sourceName, sourceChatId)}`,
    );
  } catch (e) {
    console.log(`Failed to copy file ${e}`);
    throw e;
  }
}

export async function getMessageFile(name: string, chatId?: string) {
  try {
    const data = await getMinioClient().presignedGetObject(
      S3_STORAGE_BUCKET_NAME,
      getMessageKey(name, chatId),
    );
    return data;
  } catch (e) {
    console.log(`Failed to get file ${e}`);
    throw e;
  }
}

export function isSignedUrlExpired(url: string) {
  const urlObject = new URL(url);
  const signedDate = new Date(
    urlObject.searchParams.get('X-Amz-Date') as string,
  );
  const expirationTime = Number.parseInt(
    urlObject.searchParams.get('X-Amz-Expires') as string,
    10,
  );
  const now = new Date();

  return now.getTime() > signedDate.getTime() + expirationTime * 1000;
}
