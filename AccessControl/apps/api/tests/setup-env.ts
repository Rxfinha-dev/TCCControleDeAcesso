process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-secret-with-at-least-16-chars';
process.env.STORAGE_DRIVER = 'database';
process.env.SMTP_HOST = '';
