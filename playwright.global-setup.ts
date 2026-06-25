import { execSync } from 'child_process';
import { FullConfig } from '@playwright/test';
import fs from 'fs';

async function globalSetup(config: FullConfig) {
  process.env.DATABASE_URL = 'file:./test.db';
  console.log('Migrating test database...');
  execSync('npx prisma migrate dev --name test_init --skip-seed', { stdio: 'inherit' });

  // Create an empty storage state so tests don't fail looking for it
  fs.writeFileSync('storageState.json', JSON.stringify({ cookies: [], origins: [] }));
}

export default globalSetup;
