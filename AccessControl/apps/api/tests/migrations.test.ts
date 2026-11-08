import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const migration = readFileSync(join(__dirname, '../prisma/migrations/20261108000000_users_roles/migration.sql'), 'utf-8');

describe('Migration users_roles', () => {
  it('habilita RLS na tabela users, como nas demais tabelas', () => {
    expect(migration).toMatch(/ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;/);
  });
});
