import type { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

export interface StoredPhoto {
  data: Buffer;
  mimeType: string;
}

/** Armazenamento das fotos dos alunos. */
export interface PhotoStorage {
  save(studentId: number, schoolId: number, photo: StoredPhoto): Promise<string>;
  get(studentId: number, key: string): Promise<StoredPhoto | null>;
  remove(studentId: number, key: string): Promise<void>;
}

/** Salva as fotos na tabela student_photos (equivalente ao antigo campo LONGBLOB). */
export class DatabasePhotoStorage implements PhotoStorage {
  constructor(private readonly prisma: PrismaClient) {}

  async save(studentId: number, _schoolId: number, photo: StoredPhoto) {
    const data = new Uint8Array(photo.data);
    await this.prisma.studentPhoto.upsert({
      where: { studentId },
      create: { studentId, mimeType: photo.mimeType, data },
      update: { mimeType: photo.mimeType, data },
    });
    return `db:${studentId}`;
  }

  async get(studentId: number) {
    const photo = await this.prisma.studentPhoto.findUnique({ where: { studentId } });
    return photo ? { data: Buffer.from(photo.data), mimeType: photo.mimeType } : null;
  }

  async remove(studentId: number) {
    await this.prisma.studentPhoto.deleteMany({ where: { studentId } });
  }
}

/** Salva as fotos em um bucket privado do Supabase Storage. */
export class SupabasePhotoStorage implements PhotoStorage {
  private client = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
  private bucket = env.SUPABASE_STORAGE_BUCKET;
  private bucketReady: Promise<void> | null = null;

  /** Cria o bucket privado na primeira gravação, caso ainda não exista. */
  private ensureBucket() {
    this.bucketReady ??= (async () => {
      const { data } = await this.client.storage.getBucket(this.bucket);
      if (data) return;
      const { error } = await this.client.storage.createBucket(this.bucket, {
        public: false,
        fileSizeLimit: 2 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'],
      });
      if (error && !/already exists/i.test(error.message)) throw error;
    })().catch((error) => {
      this.bucketReady = null;
      throw error;
    });
    return this.bucketReady;
  }

  async save(studentId: number, schoolId: number, photo: StoredPhoto) {
    await this.ensureBucket();
    const extension = photo.mimeType.split('/')[1] ?? 'jpg';
    const key = `school-${schoolId}/student-${studentId}-${Date.now()}.${extension}`;
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(key, photo.data, { contentType: photo.mimeType, upsert: true });
    if (error) throw error;
    return key;
  }

  async get(_studentId: number, key: string) {
    const { data, error } = await this.client.storage.from(this.bucket).download(key);
    if (error || !data) return null;
    return { data: Buffer.from(await data.arrayBuffer()), mimeType: data.type || 'image/jpeg' };
  }

  async remove(_studentId: number, key: string) {
    await this.client.storage.from(this.bucket).remove([key]);
  }
}

export function createPhotoStorage(prisma: PrismaClient): PhotoStorage {
  return env.STORAGE_DRIVER === 'supabase' ? new SupabasePhotoStorage() : new DatabasePhotoStorage(prisma);
}
